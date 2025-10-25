"""
Utility functions for the Mirqab backend
"""

import base64
import io
import cv2
import numpy as np
from PIL import Image

def encode_image_to_base64(image: Image.Image, format: str = "JPEG") -> str:
    """
    Encode PIL Image to base64 string
    
    Args:
        image: PIL Image object
        format: Image format (JPEG, PNG)
    
    Returns:
        Base64 encoded string with data URI prefix
    """
    buffered = io.BytesIO()
    image.save(buffered, format=format)
    img_base64 = base64.b64encode(buffered.getvalue()).decode('utf-8')
    return f"data:image/{format.lower()};base64,{img_base64}"

def decode_base64_to_image(base64_string: str) -> Image.Image:
    """
    Decode base64 string to PIL Image
    
    Args:
        base64_string: Base64 encoded image string
    
    Returns:
        PIL Image object
    """
    # Remove data URI prefix if present
    if ',' in base64_string:
        base64_string = base64_string.split(',')[1]
    
    img_bytes = base64.b64decode(base64_string)
    return Image.open(io.BytesIO(img_bytes))

def detect_soldiers(mask: np.ndarray, instances=None) -> list:
    """
    Detect soldiers from binary segmentation mask
    ONLY returns camouflage soldier detections (class 0 or 1 depending on model)
    
    Args:
        mask: Binary segmentation mask (0 = background, 1 = camouflage soldier)
        instances: Optional - can be segmentation map or any additional data (for compatibility)
    
    Returns:
        List of detection dictionaries with bounding boxes and metadata (soldiers only)
    """
    detections = []
    
    # For DeepLabV3 semantic segmentation, extract instances from the binary mask
    # using connected components
    soldier_mask = (mask == 1).astype(np.uint8)
    
    # Find connected components with stats
    num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(soldier_mask, connectivity=8)
    
    min_area = 100  # Minimum pixels for valid detection
    
    for i in range(1, num_labels):  # Skip background (label 0)
        area = stats[i, cv2.CC_STAT_AREA]
        if area >= min_area:
            x = int(stats[i, cv2.CC_STAT_LEFT])
            y = int(stats[i, cv2.CC_STAT_TOP])
            w = int(stats[i, cv2.CC_STAT_WIDTH])
            h = int(stats[i, cv2.CC_STAT_HEIGHT])
            cx, cy = centroids[i]
            
            detections.append({
                "bbox": {"x": x, "y": y, "width": w, "height": h},
                "centroid": {"x": float(cx), "y": float(cy)},
                "area": int(area),
                "confidence": min(0.95, 0.7 + (area / 10000)),
                "class_id": 0,
                "class_name": "camouflage_soldier"
            })
    
    return detections

def process_video(video_path: str, frame_callback, sample_rate: int = 30):
    """
    Process video file frame by frame
    
    Args:
        video_path: Path to video file
        frame_callback: Function to call for each sampled frame
        sample_rate: Process every Nth frame
    
    Returns:
        List of results from frame_callback
    """
    cap = cv2.VideoCapture(video_path)
    results = []
    frame_count = 0
    
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
        
        # Sample frames
        if frame_count % sample_rate == 0:
            # Convert BGR to RGB
            frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            image = Image.fromarray(frame_rgb)
            
            # Process frame
            result = frame_callback(image, frame_count)
            results.append(result)
        
        frame_count += 1
    
    cap.release()
    return results

def create_colored_mask(mask: np.ndarray, color: tuple = (255, 0, 0)) -> np.ndarray:
    """
    Create a colored version of a binary mask
    
    Args:
        mask: Binary mask (H, W)
        color: RGB color tuple
    
    Returns:
        Colored mask (H, W, 3)
    """
    colored = np.zeros((*mask.shape, 3), dtype=np.uint8)
    colored[mask == 1] = color
    return colored

def overlay_mask_on_image(image, mask, alpha: float = 0.5):
    """
    Overlay a colored mask on an image
    
    Args:
        image: PIL Image or numpy array
        mask: Binary mask (H, W)
        alpha: Transparency of overlay (0-1)
    
    Returns:
        PIL Image with overlay
    """
    # Convert PIL to numpy if needed
    if isinstance(image, Image.Image):
        image_np = np.array(image)
    else:
        image_np = image
    
    # Validate mask
    if mask is None:
        print("⚠️ Warning: Received None mask, returning original image")
        return Image.fromarray(image_np) if isinstance(image, Image.Image) else image
    
    # Ensure mask is numpy array
    if not isinstance(mask, np.ndarray):
        print(f"⚠️ Warning: Mask is not numpy array (type: {type(mask)}), returning original image")
        return Image.fromarray(image_np) if isinstance(image, Image.Image) else image
    
    # Check dimensions match
    if mask.shape[:2] != image_np.shape[:2]:
        print(f"⚠️ Warning: Mask shape {mask.shape} doesn't match image shape {image_np.shape}, returning original image")
        return Image.fromarray(image_np) if isinstance(image, Image.Image) else image
    
    try:
        # Create overlay
        overlay = image_np.copy()
        color_map = np.array([[0, 0, 0], [255, 0, 0]], dtype=np.uint8)  # Red for soldiers
        colored_mask = color_map[mask]
        
        # Apply overlay where mask == 1
        soldier_pixels = mask == 1
        
        # Check if there are any soldier pixels to avoid empty array errors
        if not soldier_pixels.any():
            # No soldiers detected, return original image
            return Image.fromarray(image_np)
        
        overlay[soldier_pixels] = cv2.addWeighted(
            overlay[soldier_pixels], 1-alpha,
            colored_mask[soldier_pixels], alpha, 0
        )
        
        # Return as PIL Image
        return Image.fromarray(overlay)
    except Exception as e:
        print(f"⚠️ Warning: Error in overlay_mask_on_image: {str(e)}, returning original image")
        return Image.fromarray(image_np) if isinstance(image, Image.Image) else image

def estimate_object_count(mask: np.ndarray, min_area: int = 500) -> int:
    """
    Estimate number of objects in a binary mask
    
    Args:
        mask: Binary segmentation mask
        min_area: Minimum area (pixels) for valid object
    
    Returns:
        Estimated object count
    """
    # Morphological operations to clean up mask
    kernel = np.ones((5, 5), np.uint8)
    cleaned = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)
    cleaned = cv2.morphologyEx(cleaned, cv2.MORPH_OPEN, kernel)
    
    # Find contours
    contours, _ = cv2.findContours(
        cleaned.astype(np.uint8),
        cv2.RETR_EXTERNAL,
        cv2.CHAIN_APPROX_SIMPLE
    )
    
    # Count contours with area above threshold
    count = sum(1 for c in contours if cv2.contourArea(c) >= min_area)
    
    return count

def validate_image(image: Image.Image) -> bool:
    """
    Validate that image is suitable for processing
    
    Args:
        image: PIL Image
    
    Returns:
        True if valid, False otherwise
    """
    # Check minimum dimensions
    min_size = 100
    if image.width < min_size or image.height < min_size:
        return False
    
    # Check maximum dimensions (to prevent memory issues)
    max_size = 4096
    if image.width > max_size or image.height > max_size:
        return False
    
    # Check mode
    if image.mode not in ['RGB', 'RGBA', 'L']:
        return False
    
    return True

def resize_image_if_needed(image: Image.Image, max_size: int = 2048) -> Image.Image:
    """
    Resize image if it exceeds maximum dimensions
    
    Args:
        image: PIL Image
        max_size: Maximum width or height
    
    Returns:
        Resized image (or original if no resize needed)
    """
    if image.width <= max_size and image.height <= max_size:
        return image
    
    # Calculate new size maintaining aspect ratio
    ratio = min(max_size / image.width, max_size / image.height)
    new_size = (int(image.width * ratio), int(image.height * ratio))
    
    return image.resize(new_size, Image.Resampling.LANCZOS)
