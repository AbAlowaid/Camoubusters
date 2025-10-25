"""
Firebase Storage Handler for Mirqab
Manages image uploads and file storage
"""

import os
import base64
import uuid
from datetime import datetime
from typing import Optional
from firebase_admin import storage
from firebase_admin import credentials
import firebase_admin

class FirebaseStorageHandler:
    def __init__(self):
        """Initialize Firebase Storage connection"""
        self.bucket = None
        self._initialized = False
        
    def initialize(self):
        """Initialize Firebase Storage"""
        try:
            if self._initialized:
                print("⚠️  Firebase Storage already initialized")
                return True
            
            # Check if Firebase Admin SDK is already initialized
            try:
                # Try to get the default app
                app = firebase_admin.get_app()
            except ValueError:
                # App doesn't exist, initialize it
                print("❌ Firebase Admin SDK not initialized. Please initialize Firestore first.")
                return False
                
            # Get the default bucket
            self.bucket = storage.bucket('mirqab-9de3f.firebasestorage.app')
            self._initialized = True
            print("✅ Firebase Storage initialized successfully")
            return True
            
        except Exception as e:
            print(f"❌ Error initializing Firebase Storage: {e}")
            return False
    
    def upload_image(self, image_data: str, report_id: str, image_type: str = "original") -> Optional[str]:
        """
        Upload image to Firebase Storage
        
        Args:
            image_data: Base64 encoded image data
            report_id: Report ID for organizing files
            image_type: Type of image (original, segmented, etc.)
        
        Returns:
            str: Public URL of uploaded image, or None if failed
        """
        try:
            if not self._initialized:
                print("❌ Firebase Storage not initialized")
                return None
            
            # Decode base64 image
            if image_data.startswith('data:image'):
                # Remove data URI prefix
                image_data = image_data.split(',')[1]
            
            image_bytes = base64.b64decode(image_data)
            
            # Generate filename
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"reports/{report_id}/{image_type}_{timestamp}.jpg"
            
            # Upload to Firebase Storage
            blob = self.bucket.blob(filename)
            blob.upload_from_string(image_bytes, content_type='image/jpeg')
            
            # Make the blob publicly accessible
            blob.make_public()
            
            # Get public URL
            public_url = blob.public_url
            
            print(f"✅ Image uploaded: {filename}")
            return public_url
            
        except Exception as e:
            print(f"❌ Error uploading image: {e}")
            return None
    
    def upload_file(self, file_data: bytes, filename: str, content_type: str = "application/octet-stream") -> Optional[str]:
        """
        Upload any file to Firebase Storage
        
        Args:
            file_data: File data as bytes
            filename: Name for the file in storage
            content_type: MIME type of the file
        
        Returns:
            str: Public URL of uploaded file, or None if failed
        """
        try:
            if not self._initialized:
                print("❌ Firebase Storage not initialized")
                return None
            
            # Upload to Firebase Storage
            blob = self.bucket.blob(filename)
            blob.upload_from_string(file_data, content_type=content_type)
            
            # Make the blob publicly accessible
            blob.make_public()
            
            # Get public URL
            public_url = blob.public_url
            
            print(f"✅ File uploaded: {filename}")
            return public_url
            
        except Exception as e:
            print(f"❌ Error uploading file: {e}")
            return None
    
    def delete_file(self, filename: str) -> bool:
        """
        Delete a file from Firebase Storage
        
        Args:
            filename: Name of the file to delete
        
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            if not self._initialized:
                print("❌ Firebase Storage not initialized")
                return False
            
            blob = self.bucket.blob(filename)
            blob.delete()
            
            print(f"✅ File deleted: {filename}")
            return True
            
        except Exception as e:
            print(f"❌ Error deleting file: {e}")
            return False
    
    def list_files(self, prefix: str = "") -> list:
        """
        List files in Firebase Storage
        
        Args:
            prefix: Prefix to filter files
        
        Returns:
            list: List of file names
        """
        try:
            if not self._initialized:
                print("❌ Firebase Storage not initialized")
                return []
            
            blobs = self.bucket.list_blobs(prefix=prefix)
            files = [blob.name for blob in blobs]
            
            print(f"✅ Listed {len(files)} files")
            return files
            
        except Exception as e:
            print(f"❌ Error listing files: {e}")
            return []


# Global instance
firebase_storage_handler = FirebaseStorageHandler()
