const mongoose = require('mongoose');
const { Schema } = mongoose;

const complaintSchema = new Schema({
  clientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  description: { type: String, required: true },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number],
      required: true
    }
  },
  address: String,
  photoUrl: { type: String, required: true },
  status: {
    type: String,
    enum: ['pending', 'assigned', 'in_progress', 'completed', 'rejected'],
    default: 'pending'
  },
  assignedDriverId: { type: Schema.Types.ObjectId, ref: 'User' },
  assignedTruckId: { type: Schema.Types.ObjectId, ref: 'Truck' },
  assignedAt: Date,
  completedAt: Date,
  completionPhotoUrl: String,
  aiAnalysis: {
    garbageType: String,
    estimatedVolume: Number,
    priority: Number
  }
}, { timestamps: true });

complaintSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Complaint', complaintSchema);