import cv2
import numpy as np
from tensorflow.keras.models import load_model
from .kafkaService import publish_analysis

class ImageAnalyzer:
    def __init__(self, model_path):
        self.model = load_model(model_path)
        self.classes = ['organic', 'recyclable', 'hazardous']
        
    def analyze_image(self, image_path):
        # Load and preprocess image
        img = cv2.imread(image_path)
        img = cv2.resize(img, (224, 224))
        img = img / 255.0
        img = np.expand_dims(img, axis=0)
        
        # Predict garbage type
        predictions = self.model.predict(img)
        garbage_type = self.classes[np.argmax(predictions)]
        
        # Estimate volume (simplified example)
        gray = cv2.cvtColor(cv2.imread(image_path), cv2.COLOR_BGR2GRAY)
        _, thresh = cv2.threshold(gray, 127, 255, cv2.THRESH_BINARY)
        contours, _ = cv2.findContours(thresh, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
        volume = sum(cv2.contourArea(cnt) for cnt in contours) / 1000
        
        # Determine priority
        priority = self.calculate_priority(garbage_type, volume)
        
        return {
            'garbage_type': garbage_type,
            'estimated_volume': volume,
            'priority': priority
        }
    
    def calculate_priority(self, garbage_type, volume):
        type_weights = {
            'hazardous': 3,
            'organic': 2,
            'recyclable': 1
        }
        volume_weight = min(volume / 10, 3)  # Cap at 3
        return type_weights[garbage_type] + volume_weight