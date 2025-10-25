#!/usr/bin/env python3
"""
Mirqab Raspberry Pi Detection Script
Captures images from Pi Camera, runs detection, and sends reports to backend
"""

import os
import sys
import time
import json
import base64
import requests
from datetime import datetime
from io import BytesIO
from picamera2 import Picamera2
import cv2
import numpy as np
from PIL import Image

# Configuration
BACKEND_URL = os.getenv("MIRQAB_BACKEND_URL", "http://localhost:8000")
DEVICE_ID = os.getenv("DEVICE_ID", "Pi-001-MainHall")
API_KEY = os.getenv("MIRQAB_API_KEY", "your-api-key-here")
CAPTURE_INTERVAL = int(os.getenv("CAPTURE_INTERVAL", "5"))  # seconds
DETECTION_THRESHOLD = float(os.getenv("DETECTION_THRESHOLD", "0.7"))

# Initialize camera
print(f"🎥 Initializing Raspberry Pi Camera for device: {DEVICE_ID}")
picam2 = Picamera2()

# Configure camera (1920x1080 or lower for performance)
camera_config = picam2.create_still_configuration(
    main={"size": (1920, 1080)},
    lores={"size": (640, 480)},
    display="lores"
)
picam2.configure(camera_config)
picam2.start()

# Wait for camera to warm up
time.sleep(2)
print("✅ Camera initialized successfully")


def capture_image():
    """Capture image from Pi camera"""
    try:
        # Capture image as numpy array
        image_array = picam2.capture_array()
        
        # Convert from RGB to BGR for OpenCV
        image_bgr = cv2.cvtColor(image_array, cv2.COLOR_RGB2BGR)
        
        # Convert to PIL Image
        pil_image = Image.fromarray(cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB))
        
        return pil_image, image_bgr
    except Exception as e:
        print(f"❌ Error capturing image: {e}")
        return None, None


def run_detection(image_pil):
    """
    Run detection on the captured image
    This is a placeholder - replace with your actual detection model
    
    Returns:
        dict: Detection results with keys:
            - detected: bool
            - confidence: float
            - count: int
            - summary: str
    """
    # PLACEHOLDER: Replace this with your actual DeepLabV3 model inference
    # For now, return mock detection results
    
    # Example: You would load your model here and run inference
    # mask, instances = model.predict(image_pil)
    # soldier_count = len(instances)
    
    # Mock detection for demonstration
    detected = np.random.random() > 0.5  # Random detection
    confidence = np.random.uniform(0.75, 0.95) if detected else 0.0
    count = np.random.randint(1, 5) if detected else 0
    
    return {
        "detected": detected,
        "confidence": float(confidence),
        "count": int(count),
        "summary": f"{count} object(s) detected with {confidence:.2f} confidence" if detected else "No objects detected"
    }


def encode_image(pil_image):
    """Encode PIL Image to base64 string"""
    buffered = BytesIO()
    pil_image.save(buffered, format="JPEG", quality=85)
    img_base64 = base64.b64encode(buffered.getvalue()).decode('utf-8')
    return img_base64


def send_detection_report(detection_results, image_base64):
    """
    Send detection report to Mirqab backend
    
    Args:
        detection_results: Detection results from run_detection()
        image_base64: Base64 encoded image string
    """
    try:
        # Prepare report payload
        report_data = {
            "source_device_id": DEVICE_ID,
            "detection_type": "Motion" if detection_results["detected"] else "None",
            "confidence_score": detection_results["confidence"],
            "summary_text": detection_results["summary"],
            "metadata": {
                "object_count": detection_results["count"],
                "detection_algorithm": "DeepLabV3-ResNet101",
                "image_resolution": "1920x1080"
            },
            "image_data": image_base64,
            "api_key": API_KEY
        }
        
        # Send POST request to backend
        print(f"📡 Sending detection report to {BACKEND_URL}/api/report_detection...")
        response = requests.post(
            f"{BACKEND_URL}/api/report_detection",
            json=report_data,
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Report sent successfully!")
            print(f"   Report ID: {result.get('report_id', 'N/A')}")
            print(f"   Timestamp: {result.get('timestamp', 'N/A')}")
            return True
        else:
            print(f"❌ Failed to send report: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error sending report: {e}")
        return False


def main_loop():
    """Main detection loop"""
    print(f"\n🚀 Starting Mirqab detection loop")
    print(f"   Device ID: {DEVICE_ID}")
    print(f"   Backend URL: {BACKEND_URL}")
    print(f"   Capture Interval: {CAPTURE_INTERVAL}s")
    print(f"   Detection Threshold: {DETECTION_THRESHOLD}")
    print("\n" + "="*60 + "\n")
    
    frame_count = 0
    detection_count = 0
    
    try:
        while True:
            frame_count += 1
            print(f"\n[Frame {frame_count}] {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
            
            # Capture image
            print("📸 Capturing image...")
            pil_image, cv_image = capture_image()
            
            if pil_image is None:
                print("⚠️  Failed to capture image, skipping frame")
                time.sleep(CAPTURE_INTERVAL)
                continue
            
            print(f"✓ Image captured ({pil_image.size[0]}x{pil_image.size[1]})")
            
            # Run detection
            print("🔍 Running detection...")
            detection_results = run_detection(pil_image)
            
            print(f"✓ Detection complete:")
            print(f"   Detected: {detection_results['detected']}")
            print(f"   Confidence: {detection_results['confidence']:.2f}")
            print(f"   Count: {detection_results['count']}")
            
            # Only send report if detection confidence exceeds threshold
            if detection_results["detected"] and detection_results["confidence"] >= DETECTION_THRESHOLD:
                detection_count += 1
                print(f"\n🎯 Detection #{detection_count} triggered! Sending report...")
                
                # Encode image
                image_base64 = encode_image(pil_image)
                
                # Send report
                success = send_detection_report(detection_results, image_base64)
                
                if success:
                    print("✅ Detection cycle complete\n")
                else:
                    print("⚠️  Report sending failed, but continuing...\n")
            else:
                print("⏭️  No significant detection, skipping report\n")
            
            # Wait before next capture
            print(f"⏳ Waiting {CAPTURE_INTERVAL}s until next capture...")
            time.sleep(CAPTURE_INTERVAL)
            
    except KeyboardInterrupt:
        print("\n\n🛑 Detection loop stopped by user")
        print(f"\nStatistics:")
        print(f"   Total frames: {frame_count}")
        print(f"   Detections sent: {detection_count}")
    except Exception as e:
        print(f"\n❌ Fatal error in main loop: {e}")
        import traceback
        traceback.print_exc()
    finally:
        # Cleanup
        print("\n🧹 Cleaning up...")
        picam2.stop()
        print("✅ Camera stopped")


if __name__ == "__main__":
    print("="*60)
    print("   MIRQAB RASPBERRY PI DETECTION SYSTEM")
    print("="*60)
    
    # Check required environment variables
    if API_KEY == "your-api-key-here":
        print("\n⚠️  WARNING: Using default API key!")
        print("   Set MIRQAB_API_KEY environment variable for production\n")
    
    # Start main loop
    try:
        main_loop()
    except Exception as e:
        print(f"\n❌ Fatal error: {e}")
        sys.exit(1)
