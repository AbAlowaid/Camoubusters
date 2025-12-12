"""
Local Storage Handler for Mirqab
Manages image uploads and file storage on local filesystem
Replaces Firebase Storage with local file system storage
"""

import os
import base64
import uuid
from datetime import datetime
from typing import Optional
from pathlib import Path
import shutil

class LocalStorageHandler:
    def __init__(self, storage_dir: str = "storage", base_url: str = "http://localhost:8000"):
        """
        Initialize Local Storage Handler
        
        Args:
            storage_dir: Directory to store files (relative to backend directory)
            base_url: Base URL for accessing files via HTTP
        """
        # Get absolute path relative to backend directory
        backend_dir = Path(__file__).parent
        self.storage_dir = backend_dir / storage_dir
        self.base_url = base_url
        self._initialized = False
        
    def initialize(self):
        """Initialize local storage directory"""
        try:
            if self._initialized:
                print("⚠️  Local Storage already initialized")
                return True
            
            # Create storage directories
            self.storage_dir.mkdir(exist_ok=True)
            (self.storage_dir / "reports").mkdir(exist_ok=True)
            (self.storage_dir / "uploads").mkdir(exist_ok=True)
            
            self._initialized = True
            print(f"✅ Local Storage initialized at: {self.storage_dir}")
            return True
            
        except Exception as e:
            print(f"❌ Error initializing Local Storage: {e}")
            return False
    
    def upload_image(self, image_data: str, report_id: str, image_type: str = "original") -> Optional[str]:
        """
        Save image to local filesystem
        
        Args:
            image_data: Base64 encoded image data
            report_id: Report ID for organizing files
            image_type: Type of image (original, segmented, etc.)
        
        Returns:
            str: Relative URL path to access the image, or None if failed
        """
        try:
            if not self._initialized:
                print("❌ Local Storage not initialized")
                return None
            
            # Decode base64 image
            if image_data.startswith('data:image'):
                # Remove data URI prefix
                image_data = image_data.split(',')[1]
            
            image_bytes = base64.b64decode(image_data)
            
            # Create report directory
            report_dir = self.storage_dir / "reports" / report_id
            report_dir.mkdir(parents=True, exist_ok=True)
            
            # Generate filename
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"{image_type}_{timestamp}.jpg"
            filepath = report_dir / filename
            
            # Save image
            with open(filepath, 'wb') as f:
                f.write(image_bytes)
            
            # Return full URL path
            relative_path = f"/storage/reports/{report_id}/{filename}"
            full_url = f"{self.base_url}{relative_path}"
            
            print(f"✅ Image saved: {full_url}")
            return full_url
            
        except Exception as e:
            print(f"❌ Error saving image: {e}")
            import traceback
            traceback.print_exc()
            return None
    
    def upload_file(self, file_data: bytes, filename: str, content_type: str = "application/octet-stream") -> Optional[str]:
        """
        Save any file to local filesystem
        
        Args:
            file_data: File data as bytes
            filename: Name for the file in storage
            content_type: MIME type of the file
        
        Returns:
            str: Relative URL path to access the file, or None if failed
        """
        try:
            if not self._initialized:
                print("❌ Local Storage not initialized")
                return None
            
            # Create uploads directory if needed
            upload_dir = self.storage_dir / "uploads"
            upload_dir.mkdir(parents=True, exist_ok=True)
            
            # Generate unique filename
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            unique_filename = f"{timestamp}_{filename}"
            filepath = upload_dir / unique_filename
            
            # Save file
            with open(filepath, 'wb') as f:
                f.write(file_data)
            
            # Return full URL path
            relative_path = f"/storage/uploads/{unique_filename}"
            full_url = f"{self.base_url}{relative_path}"
            
            print(f"✅ File saved: {full_url}")
            return full_url
            
        except Exception as e:
            print(f"❌ Error saving file: {e}")
            return None
    
    def delete_file(self, file_path: str) -> bool:
        """
        Delete a file from local storage
        
        Args:
            file_path: Relative path to the file (e.g., "/storage/reports/xxx/image.jpg")
        
        Returns:
            bool: True if deleted successfully, False otherwise
        """
        try:
            # Convert relative URL path to absolute filesystem path
            if file_path.startswith('/storage/'):
                file_path = file_path.replace('/storage/', '')
            
            abs_path = self.storage_dir / file_path
            
            if abs_path.exists():
                abs_path.unlink()
                print(f"✅ File deleted: {file_path}")
                return True
            else:
                print(f"⚠️  File not found: {file_path}")
                return False
                
        except Exception as e:
            print(f"❌ Error deleting file: {e}")
            return False
    
    def get_file_path(self, relative_path: str) -> Optional[Path]:
        """
        Get absolute filesystem path from relative URL path
        
        Args:
            relative_path: Relative URL path (e.g., "/storage/reports/xxx/image.jpg")
        
        Returns:
            Path: Absolute filesystem path, or None if not found
        """
        try:
            # Convert relative URL path to filesystem path
            if relative_path.startswith('/storage/'):
                relative_path = relative_path.replace('/storage/', '')
            
            abs_path = self.storage_dir / relative_path
            
            if abs_path.exists():
                return abs_path
            else:
                return None
                
        except Exception as e:
            print(f"❌ Error getting file path: {e}")
            return None

# Global instance
local_storage_handler = LocalStorageHandler()
