"""
Model Handler - Load and run the ResNet Keras model
Keras-based segmentation with camouflage detection
"""

import tensorflow as tf
from tensorflow import keras
from PIL import Image
import numpy as np
import cv2
from pathlib import Path

class SegmentationModel:
    def __init__(self, model_path: str = "../resnet_finetuned_best.h5"):
        self.model_path = Path(model_path)
        self.model = None
        self.class_names = {0: "background", 1: "camouflage_soldier"}
        self.num_classes = 2  # background + camouflage_soldier
        self._loaded = False
        self.input_size = (256, 256)  # Model input size
        
        # Check for GPU availability
        gpus = tf.config.list_physical_devices('GPU')
        if gpus:
            print(f"Using GPU: {gpus}")
        else:
            print("Using CPU")
        
        print(f"TensorFlow version: {tf.__version__}")
    
    def load_model(self):
        try:
            print(f"Loading Keras ResNet model...")
            print(f"   Model path: {self.model_path}")
            
            if not self.model_path.exists():
                raise FileNotFoundError(f"Model file not found: {self.model_path}")
            
            # Load the Keras model
            self.model = keras.models.load_model(str(self.model_path), compile=False)
            
            # Compile the model for inference
            self.model.compile(
                optimizer='adam',
                loss='sparse_categorical_crossentropy',
                metrics=['accuracy']
            )
            
            self._loaded = True
            print("Keras ResNet model loaded successfully!")
            print(f"   - Model type: Keras/TensorFlow")
            print(f"   - Input shape: {self.model.input_shape}")
            print(f"   - Output shape: {self.model.output_shape}")
            print(f"   - Number of classes: {self.num_classes}")
            print(f"   - Class names: {self.class_names}")
        except Exception as e:
            print(f"Error loading model: {str(e)}")
            import traceback
            traceback.print_exc()
            raise
    
    def is_loaded(self):
        return self._loaded
    
    def predict(self, image):
        """
        Predict segmentation mask for a single image.
        Returns binary mask and segmentation map.
        """
        if not self._loaded:
            raise RuntimeError("Model not loaded. Call load_model() first.")
        
        try:
            # Get original dimensions
            original_width, original_height = image.size
            
            # Preprocess image for ResNet
            # Resize to model input size
            img_resized = image.resize(self.input_size, Image.Resampling.LANCZOS)
            
            # Convert to numpy array and normalize
            img_array = np.array(img_resized).astype(np.float32)
            img_array = img_array / 255.0  # Normalize to [0, 1]
            
            # Add batch dimension
            input_tensor = np.expand_dims(img_array, axis=0)
            
            # Run inference
            output = self.model.predict(input_tensor, verbose=0)
            
            # Get segmentation map (class predictions for each pixel)
            # Output shape: (1, height, width, 1) for binary segmentation
            # The model outputs probabilities in a single channel
            if len(output.shape) == 4 and output.shape[-1] == 1:
                # Single channel binary segmentation - squeeze and threshold
                prob_map = output[0, :, :, 0]  # Remove batch and channel dims
                segmentation_map = (prob_map > 0.5).astype(np.uint8)
            elif len(output.shape) == 4 and output.shape[-1] > 1:
                # Multi-class segmentation - use argmax
                segmentation_map = np.argmax(output[0], axis=-1).astype(np.uint8)
            else:
                # Already 2D
                segmentation_map = (output[0] > 0.5).astype(np.uint8)
            
            # Resize to original image size
            segmentation_map = cv2.resize(
                segmentation_map,
                (original_width, original_height),
                interpolation=cv2.INTER_NEAREST
            )
            
            # For binary segmentation, the mask IS the soldier detection (1 = soldier, 0 = background)
            binary_mask = segmentation_map.astype(np.uint8)
            
            return binary_mask, segmentation_map
            
        except Exception as e:
            print(f"Error in prediction: {str(e)}")
            import traceback
            traceback.print_exc()
            # Return empty masks on error
            empty_mask = np.zeros((original_height, original_width), dtype=np.uint8)
            empty_seg_map = np.zeros((original_height, original_width), dtype=np.uint8)
            return empty_mask, empty_seg_map
    
    def predict_with_details(self, image):
        """
        Predict with detailed instance extraction using connected components.
        Returns mask, instances, and counts.
        """
        binary_mask, segmentation_map = self.predict(image)
        
        detections = []
        soldier_count = 0
        
        # Extract individual soldier instances using connected components
        if np.any(binary_mask > 0):
            num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(
                binary_mask, connectivity=8
            )
            
            # Minimum area threshold to filter noise
            min_area = 100
            
            for i in range(1, num_labels):  # Skip background (label 0)
                area = stats[i, cv2.CC_STAT_AREA]
                
                if area >= min_area:
                    x = int(stats[i, cv2.CC_STAT_LEFT])
                    y = int(stats[i, cv2.CC_STAT_TOP])
                    w = int(stats[i, cv2.CC_STAT_WIDTH])
                    h = int(stats[i, cv2.CC_STAT_HEIGHT])
                    
                    # Create instance mask
                    instance_mask = (labels == i).astype(np.uint8)
                    
                    detections.append({
                        "bbox": [x, y, x + w, y + h],
                        "score": 0.95,
                        "confidence": 0.95,
                        "mask": instance_mask,
                        "class_id": 1,
                        "class_name": "camouflage_soldier"
                    })
                    soldier_count += 1
        
        return {
            "mask": binary_mask,
            "instances": detections,
            "soldier_count": soldier_count,
            "civilian_count": 0,
            "total_count": soldier_count,
            "count": soldier_count
        }
    
    def predict_batch(self, images):
        """
        Predict on a batch of images.
        Returns list of (mask, segmentation_map) tuples.
        """
        if not self._loaded:
            raise RuntimeError("Model not loaded. Call load_model() first.")
        
        results = []
        for image in images:
            mask, seg_map = self.predict(image)
            results.append((mask, seg_map))
        
        return results
