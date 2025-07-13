const Complaint = require('../models/Complaint');
const Truck = require('../models/Truck');
const User = require('../models/User');
const kafka = require('../config/kafka');
const { publishComplaintEvent } = require('../services/notificationService');

exports.createComplaint = async (req, res) => {
  try {
    const { description, latitude, longitude, address } = req.body;
    const photoUrl = req.file.path;
    
    const complaint = new Complaint({
      clientId: req.user.id,
      description,
      location: {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)]
      },
      address,
      photoUrl
    });

    await complaint.save();
    
    // Send to AI service for analysis via Kafka
    await kafka.producer.send({
      topic: 'complaints',
      messages: [{
        value: JSON.stringify({
          complaintId: complaint._id,
          photoUrl: complaint.photoUrl
        })
      }]
    });

    res.status(201).json(complaint);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.assignComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    // Find available trucks within 5km radius
    const trucks = await Truck.find({
      status: 'available',
      currentLoad: { $lt: 0.8 * capacity }, // 80% capacity threshold
      currentLocation: {
        $near: {
          $geometry: complaint.location,
          $maxDistance: 5000 // 5km
        }
      }
    }).sort({ currentLoad: 1 }).limit(1);

    if (trucks.length > 0) {
      const truck = trucks[0];
      complaint.assignedDriverId = truck.driverId;
      complaint.assignedTruckId = truck._id;
      complaint.status = 'assigned';
      complaint.assignedAt = new Date();
      
      await complaint.save();
      
      // Notify driver
      await publishComplaintEvent(complaint, 'assigned');
      
      return res.json(complaint);
    }

    // If no trucks available, escalate to office
    complaint.status = 'escalated';
    await complaint.save();
    
    // Notify office
    await publishComplaintEvent(complaint, 'escalated');
    
    res.json(complaint);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};