"""
Firebase Firestore Handler for Mirqab
Manages detection reports database
"""

import os
import json
from datetime import datetime
from typing import Dict, List, Optional
from dotenv import load_dotenv
import firebase_admin
from firebase_admin import credentials, firestore
from google.cloud.firestore_v1 import FieldFilter

# Load environment variables
load_dotenv()

class FirestoreHandler:
    def get_detection_reports(self, time_range: str = "24h", limit: int = 100, offset: int = 0) -> list:
        """
        Get detection reports for a given time range and limit.
        Args:
            time_range: '24h', '7d', '30d', etc.
            limit: max number of reports
            offset: skip first N reports
        Returns:
            list: List of report dicts
        """
        from datetime import datetime, timedelta
        end_date = datetime.now()
        if time_range == "24h":
            start_date = end_date - timedelta(hours=24)
        elif time_range == "7d":
            start_date = end_date - timedelta(days=7)
        elif time_range == "30d":
            start_date = end_date - timedelta(days=30)
        else:
            start_date = None
        reports = self.query_reports(start_date=start_date, end_date=end_date, limit=limit+offset)
        if offset:
            reports = reports[offset:]
        return reports
    def __init__(self, credentials_path: str = None):
        """
        Initialize Firestore connection
        
        Args:
            credentials_path: Path to Firebase service account JSON file
                            Defaults to FIREBASE_CREDENTIALS_PATH env variable
        """
        self.credentials_path = credentials_path or os.getenv("FIREBASE_CREDENTIALS_PATH")
        self.db = None
        self._initialized = False
        
    def initialize(self):
        """Initialize Firebase Admin SDK"""
        try:
            if self._initialized:
                print("⚠️  Firestore already initialized")
                return True
                
            if not self.credentials_path or not os.path.exists(self.credentials_path):
                print(f"❌ Firebase credentials not found: {self.credentials_path}")
                print("   Set FIREBASE_CREDENTIALS_PATH environment variable")
                return False
            
            # Initialize Firebase Admin SDK
            cred = credentials.Certificate(self.credentials_path)
            firebase_admin.initialize_app(cred)
            
            # Get Firestore client
            self.db = firestore.client()
            
            self._initialized = True
            print("✅ Firestore initialized successfully")
            return True
            
        except Exception as e:
            print(f"❌ Error initializing Firestore: {e}")
            import traceback
            traceback.print_exc()
            return False
    
    def generate_report_id(self) -> str:
        """
        Generate sequential report ID in format: MIR-YYYYMMDD-XXXX
        
        Returns:
            str: Unique report ID
        """
        try:
            today = datetime.now().strftime("%Y%m%d")
            prefix = f"MIR-{today}"
            
            # Query reports from today to find the last sequence number
            reports_ref = self.db.collection('detection_reports')
            query = reports_ref.where(
                filter=FieldFilter('report_id', '>=', f'{prefix}-0000')
            ).where(
                filter=FieldFilter('report_id', '<=', f'{prefix}-9999')
            ).order_by('report_id', direction=firestore.Query.DESCENDING).limit(1)
            
            docs = list(query.stream())
            
            if docs:
                # Extract sequence number from last report
                last_id = docs[0].to_dict()['report_id']
                last_seq = int(last_id.split('-')[-1])
                new_seq = last_seq + 1
            else:
                # First report today
                new_seq = 1
            
            # Format: MIR-20251024-0001
            report_id = f"{prefix}-{new_seq:04d}"
            return report_id
            
        except Exception as e:
            print(f"❌ Error generating report ID: {e}")
            # Fallback to timestamp-based ID
            return f"MIR-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
    
    def create_detection_report(self, data: Dict) -> Optional[str]:
        """
        Create a new detection report in Firestore
        
        Args:
            data: Report data dictionary with keys:
                - longitude: float (required)
                - latitude: float (required)
                - environment: str (required)
                - soldier_count: int (required)
                - attire_and_camouflage: str (required)
                - equipment: str (required)
                - source_device_id: str (optional, defaults to "Web-Upload")
        
        Returns:
            str: Generated report_id, or None if failed
        """
        try:
            if not self._initialized:
                print("❌ Firestore not initialized")
                return None
            
            # Generate unique report ID
            report_id = self.generate_report_id()
            
            # Create report document with new schema
            report = {
                "report_id": report_id,
                "timestamp": firestore.SERVER_TIMESTAMP,
                "location": {
                    "longitude": float(data.get("longitude", 0.0)),
                    "latitude": float(data.get("latitude", 0.0))
                },
                "environment": data.get("environment", "Unknown"),
                "soldier_count": int(data.get("soldier_count", 0)),
                "attire_and_camouflage": data.get("attire_and_camouflage", "Unknown"),
                "equipment": data.get("equipment", "Unknown"),
                "source_device_id": data.get("source_device_id", "Web-Upload"),
                "image_snapshot_url": data.get("image_snapshot_url", "")
            }
            
            # Add to Firestore
            self.db.collection('detection_reports').document(report_id).set(report)
            
            print(f"✅ Report created: {report_id}")
            return report_id
            
        except Exception as e:
            print(f"❌ Error creating report: {e}")
            import traceback
            traceback.print_exc()
            return None
    
    def get_report(self, report_id: str) -> Optional[Dict]:
        """
        Retrieve a specific report by ID
        
        Args:
            report_id: Report ID to retrieve
        
        Returns:
            dict: Report data, or None if not found
        """
        try:
            doc = self.db.collection('detection_reports').document(report_id).get()
            
            if doc.exists:
                report = doc.to_dict()
                # Convert Firestore timestamp to ISO string
                if 'timestamp' in report and report['timestamp']:
                    report['timestamp'] = report['timestamp'].isoformat()
                return report
            else:
                print(f"⚠️  Report not found: {report_id}")
                return None
                
        except Exception as e:
            print(f"❌ Error retrieving report: {e}")
            return None
    
    def query_reports(
        self,
        start_date: datetime = None,
        end_date: datetime = None,
        device_id: str = None,
        limit: int = 100
    ) -> List[Dict]:
        """
        Query detection reports with filters
        
        Args:
            start_date: Filter reports after this date
            end_date: Filter reports before this date
            device_id: Filter by source device
            limit: Maximum number of results
        
        Returns:
            list: List of report dictionaries
        """
        try:
            query = self.db.collection('detection_reports')
            
            # Apply filters
            if device_id:
                query = query.where(filter=FieldFilter('source_device_id', '==', device_id))
            
            if start_date:
                query = query.where(filter=FieldFilter('timestamp', '>=', start_date))
            
            if end_date:
                query = query.where(filter=FieldFilter('timestamp', '<=', end_date))
            
            # Only order by timestamp if we have filters (otherwise Firestore may need an index)
            # For simple queries, we'll sort in memory
            if device_id or start_date or end_date:
                # With filters, just limit
                query = query.limit(limit)
            else:
                # No filters - can safely order
                query = query.order_by('timestamp', direction=firestore.Query.DESCENDING).limit(limit)
            
            # Execute query
            docs = query.stream()
            
            reports = []
            for doc in docs:
                report = doc.to_dict()
                # Convert timestamp
                if 'timestamp' in report and report['timestamp']:
                    report['timestamp'] = report['timestamp'].isoformat()
                reports.append(report)
            
            print(f"✅ Retrieved {len(reports)} reports")
            return reports
            
        except Exception as e:
            print(f"❌ Error querying reports: {e}")
            import traceback
            traceback.print_exc()
            return []
    
    def search_reports(self, search_text: str, limit: int = 50) -> List[Dict]:
        """
        Search reports by keywords (searches environment, attire, equipment fields)
        
        Args:
            search_text: Text to search for
            limit: Maximum results
        
        Returns:
            list: Matching reports
        """
        try:
            # Get recent reports
            query = self.db.collection('detection_reports').order_by(
                'timestamp',
                direction=firestore.Query.DESCENDING
            ).limit(limit * 2)  # Get more to filter
            
            docs = query.stream()
            
            # Filter by search text (case-insensitive)
            search_lower = search_text.lower()
            matching_reports = []
            
            for doc in docs:
                report = doc.to_dict()
                # Search in environment, attire_and_camouflage, and equipment fields
                environment = report.get('environment', '').lower()
                attire = report.get('attire_and_camouflage', '').lower()
                equipment = report.get('equipment', '').lower()
                
                if (search_lower in environment or 
                    search_lower in attire or 
                    search_lower in equipment):
                    # Convert timestamp
                    if 'timestamp' in report and report['timestamp']:
                        report['timestamp'] = report['timestamp'].isoformat()
                    matching_reports.append(report)
                    
                    if len(matching_reports) >= limit:
                        break
            
            print(f"✅ Found {len(matching_reports)} matching reports")
            return matching_reports
            
        except Exception as e:
            print(f"❌ Error searching reports: {e}")
            return []
    
    def get_statistics(self) -> Dict:
        """
        Get database statistics
        
        Returns:
            dict: Statistics including total reports, by type, by device, etc.
        """
        try:
            # Get all reports (or recent subset)
            reports = self.query_reports(limit=1000)
            
            stats = {
                "total_reports": len(reports),
                "by_device": {},
                "by_type": {},
                "avg_confidence": 0.0
            }
            
            if not reports:
                return stats
            
            # Calculate statistics
            total_confidence = 0.0
            for report in reports:
                # Count by device
                device = report.get('source_device_id', 'Unknown')
                stats['by_device'][device] = stats['by_device'].get(device, 0) + 1
                
                # Count by type
                det_type = report.get('detection_type', 'Unknown')
                stats['by_type'][det_type] = stats['by_type'].get(det_type, 0) + 1
                
                # Sum confidence
                total_confidence += report.get('confidence_score', 0.0)
            
            stats['avg_confidence'] = total_confidence / len(reports)
            
            return stats
            
        except Exception as e:
            print(f"❌ Error getting statistics: {e}")
            return {
                "total_reports": 0,
                "by_device": {},
                "by_type": {},
                "avg_confidence": 0.0
            }


# Global instance
firestore_handler = FirestoreHandler()
