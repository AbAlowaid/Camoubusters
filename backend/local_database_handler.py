"""
Local Database Handler for Mirqab
Manages detection reports database using SQLite
Replaces Firebase Firestore with local SQLite database
"""

import sqlite3
import json
import os
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from pathlib import Path
from contextlib import contextmanager

class LocalDatabaseHandler:
    def __init__(self, db_path: str = "storage/mirqab.db"):
        """
        Initialize Local Database Handler
        
        Args:
            db_path: Path to SQLite database file (relative to backend directory)
        """
        # Get absolute path relative to backend directory
        backend_dir = Path(__file__).parent
        self.db_path = backend_dir / db_path
        self._initialized = False
        
    def initialize(self):
        """Initialize SQLite database and create tables"""
        try:
            if self._initialized:
                print("⚠️  Local Database already initialized")
                return True
            
            # Create storage directory if needed
            self.db_path.parent.mkdir(parents=True, exist_ok=True)
            
            # Create database and tables
            with self._get_connection() as conn:
                cursor = conn.cursor()
                
                # Create detection_reports table
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS detection_reports (
                        report_id TEXT PRIMARY KEY,
                        timestamp TEXT NOT NULL,
                        location_latitude REAL,
                        location_longitude REAL,
                        soldier_count INTEGER DEFAULT 0,
                        attire_and_camouflage TEXT,
                        environment TEXT,
                        equipment TEXT,
                        image_snapshot_url TEXT,
                        segmented_image_url TEXT,
                        source_device_id TEXT,
                        severity TEXT DEFAULT 'Medium',
                        status TEXT DEFAULT 'New',
                        assignee TEXT,
                        notes TEXT,
                        ai_summary TEXT,
                        created_at TEXT NOT NULL,
                        updated_at TEXT NOT NULL
                    )
                ''')
                
                # Create index on timestamp for faster queries
                cursor.execute('''
                    CREATE INDEX IF NOT EXISTS idx_timestamp 
                    ON detection_reports(timestamp)
                ''')
                
                # Create index on source_device_id
                cursor.execute('''
                    CREATE INDEX IF NOT EXISTS idx_device_id 
                    ON detection_reports(source_device_id)
                ''')
                
                conn.commit()
            
            self._initialized = True
            print(f"✅ Local Database initialized at: {self.db_path}")
            return True
            
        except Exception as e:
            print(f"❌ Error initializing Local Database: {e}")
            import traceback
            traceback.print_exc()
            return False
    
    @contextmanager
    def _get_connection(self):
        """Context manager for database connections"""
        conn = sqlite3.connect(str(self.db_path))
        conn.row_factory = sqlite3.Row  # Enable column access by name
        try:
            yield conn
        finally:
            conn.close()
    
    def save_report(self, report_data: Dict) -> bool:
        """
        Save a detection report to the database
        
        Args:
            report_data: Dictionary containing report data
        
        Returns:
            bool: True if saved successfully, False otherwise
        """
        try:
            if not self._initialized:
                print("❌ Local Database not initialized")
                return False
            
            with self._get_connection() as conn:
                cursor = conn.cursor()
                
                # Prepare data
                report_id = report_data.get('report_id')
                timestamp = report_data.get('timestamp', datetime.now().isoformat())
                location = report_data.get('location', {})
                
                now = datetime.now().isoformat()
                
                cursor.execute('''
                    INSERT OR REPLACE INTO detection_reports (
                        report_id, timestamp, location_latitude, location_longitude,
                        soldier_count, attire_and_camouflage, environment, equipment,
                        image_snapshot_url, segmented_image_url, source_device_id,
                        severity, status, assignee, notes, ai_summary,
                        created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    report_id,
                    timestamp,
                    location.get('latitude'),
                    location.get('longitude'),
                    report_data.get('soldier_count', 0),
                    report_data.get('attire_and_camouflage', ''),
                    report_data.get('environment', ''),
                    report_data.get('equipment', ''),
                    report_data.get('image_snapshot_url', ''),
                    report_data.get('segmented_image_url', ''),
                    report_data.get('source_device_id', 'web_upload'),
                    report_data.get('severity', 'Medium'),
                    report_data.get('status', 'New'),
                    report_data.get('assignee', ''),
                    report_data.get('notes', ''),
                    report_data.get('ai_summary', ''),
                    report_data.get('created_at', now),
                    now
                ))
                
                conn.commit()
                print(f"✅ Report saved: {report_id}")
                return True
                
        except Exception as e:
            print(f"❌ Error saving report: {e}")
            import traceback
            traceback.print_exc()
            return False
    
    def get_report(self, report_id: str) -> Optional[Dict]:
        """
        Get a single report by ID
        
        Args:
            report_id: Report ID
        
        Returns:
            Dict: Report data, or None if not found
        """
        try:
            if not self._initialized:
                print("❌ Local Database not initialized")
                return None
            
            with self._get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute('SELECT * FROM detection_reports WHERE report_id = ?', (report_id,))
                row = cursor.fetchone()
                
                if row:
                    return self._row_to_dict(row)
                return None
                
        except Exception as e:
            print(f"❌ Error getting report: {e}")
            return None
    
    def query_reports(self, 
                     start_date: Optional[datetime] = None,
                     end_date: Optional[datetime] = None,
                     device_id: Optional[str] = None,
                     limit: int = 100,
                     offset: int = 0) -> List[Dict]:
        """
        Query reports with filters
        
        Args:
            start_date: Filter reports after this date
            end_date: Filter reports before this date
            device_id: Filter by source device
            limit: Maximum number of reports to return
            offset: Number of reports to skip
        
        Returns:
            List[Dict]: List of reports matching the criteria
        """
        try:
            if not self._initialized:
                print("❌ Local Database not initialized")
                return []
            
            with self._get_connection() as conn:
                cursor = conn.cursor()
                
                # Build query
                query = 'SELECT * FROM detection_reports WHERE 1=1'
                params = []
                
                if start_date:
                    query += ' AND timestamp >= ?'
                    params.append(start_date.isoformat())
                
                if end_date:
                    query += ' AND timestamp <= ?'
                    params.append(end_date.isoformat())
                
                if device_id:
                    query += ' AND source_device_id = ?'
                    params.append(device_id)
                
                query += ' ORDER BY timestamp DESC LIMIT ? OFFSET ?'
                params.extend([limit, offset])
                
                cursor.execute(query, params)
                rows = cursor.fetchall()
                
                return [self._row_to_dict(row) for row in rows]
                
        except Exception as e:
            print(f"❌ Error querying reports: {e}")
            import traceback
            traceback.print_exc()
            return []
    
    def get_detection_reports(self, time_range: str = "24h", limit: int = 100, offset: int = 0) -> List[Dict]:
        """
        Get detection reports for a given time range
        
        Args:
            time_range: '24h', '7d', '30d', etc.
            limit: Maximum number of reports
            offset: Skip first N reports
        
        Returns:
            List[Dict]: List of report dictionaries
        """
        end_date = datetime.now()
        
        if time_range == "24h":
            start_date = end_date - timedelta(hours=24)
        elif time_range == "7d":
            start_date = end_date - timedelta(days=7)
        elif time_range == "30d":
            start_date = end_date - timedelta(days=30)
        else:
            start_date = None
        
        return self.query_reports(start_date=start_date, end_date=end_date, limit=limit, offset=offset)
    
    def update_report(self, report_id: str, update_data: Dict) -> bool:
        """
        Update a report
        
        Args:
            report_id: Report ID to update
            update_data: Dictionary with fields to update
        
        Returns:
            bool: True if updated successfully
        """
        try:
            if not self._initialized:
                print("❌ Local Database not initialized")
                return False
            
            with self._get_connection() as conn:
                cursor = conn.cursor()
                
                # Build update query dynamically
                allowed_fields = [
                    'severity', 'status', 'assignee', 'notes', 
                    'soldier_count', 'attire_and_camouflage', 'environment', 
                    'equipment', 'image_snapshot_url', 'segmented_image_url'
                ]
                
                updates = []
                params = []
                
                for field, value in update_data.items():
                    if field in allowed_fields:
                        updates.append(f'{field} = ?')
                        params.append(value)
                
                if not updates:
                    return False
                
                # Add updated_at
                updates.append('updated_at = ?')
                params.append(datetime.now().isoformat())
                
                # Add report_id to params
                params.append(report_id)
                
                query = f"UPDATE detection_reports SET {', '.join(updates)} WHERE report_id = ?"
                cursor.execute(query, params)
                conn.commit()
                
                print(f"✅ Report updated: {report_id}")
                return cursor.rowcount > 0
                
        except Exception as e:
            print(f"❌ Error updating report: {e}")
            return False
    
    def delete_report(self, report_id: str) -> bool:
        """
        Delete a report
        
        Args:
            report_id: Report ID to delete
        
        Returns:
            bool: True if deleted successfully
        """
        try:
            if not self._initialized:
                print("❌ Local Database not initialized")
                return False
            
            with self._get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute('DELETE FROM detection_reports WHERE report_id = ?', (report_id,))
                conn.commit()
                
                print(f"✅ Report deleted: {report_id}")
                return cursor.rowcount > 0
                
        except Exception as e:
            print(f"❌ Error deleting report: {e}")
            return False
    
    def get_all_device_ids(self) -> List[str]:
        """Get list of all unique device IDs"""
        try:
            if not self._initialized:
                return []
            
            with self._get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute('SELECT DISTINCT source_device_id FROM detection_reports ORDER BY source_device_id')
                return [row[0] for row in cursor.fetchall()]
                
        except Exception as e:
            print(f"❌ Error getting device IDs: {e}")
            return []
    
    def get_statistics(self) -> Dict:
        """Get database statistics"""
        try:
            if not self._initialized:
                return {}
            
            with self._get_connection() as conn:
                cursor = conn.cursor()
                
                # Total reports
                cursor.execute('SELECT COUNT(*) FROM detection_reports')
                total_reports = cursor.fetchone()[0]
                
                # Total soldiers detected
                cursor.execute('SELECT SUM(soldier_count) FROM detection_reports')
                total_soldiers = cursor.fetchone()[0] or 0
                
                # Reports by device
                cursor.execute('''
                    SELECT source_device_id, COUNT(*) 
                    FROM detection_reports 
                    GROUP BY source_device_id
                ''')
                by_device = {row[0]: row[1] for row in cursor.fetchall()}
                
                return {
                    'total_reports': total_reports,
                    'total_soldiers_detected': total_soldiers,
                    'reports_by_device': by_device
                }
                
        except Exception as e:
            print(f"❌ Error getting statistics: {e}")
            return {}
    
    def _row_to_dict(self, row: sqlite3.Row) -> Dict:
        """Convert SQLite Row to dictionary with proper structure"""
        return {
            'report_id': row['report_id'],
            'timestamp': row['timestamp'],
            'location': {
                'latitude': row['location_latitude'],
                'longitude': row['location_longitude']
            },
            'soldier_count': row['soldier_count'],
            'attire_and_camouflage': row['attire_and_camouflage'],
            'environment': row['environment'],
            'equipment': row['equipment'],
            'image_snapshot_url': row['image_snapshot_url'],
            'segmented_image_url': row['segmented_image_url'],
            'source_device_id': row['source_device_id'],
            'severity': row['severity'],
            'status': row['status'],
            'assignee': row['assignee'],
            'notes': row['notes'],
            'ai_summary': row['ai_summary'],
            'created_at': row['created_at'],
            'updated_at': row['updated_at']
        }

# Global instance
local_database_handler = LocalDatabaseHandler()
