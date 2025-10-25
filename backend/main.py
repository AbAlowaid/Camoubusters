"""
Mirqab Backend - Main FastAPI Application
Automatic AI Report Generation with Complete PDF Export Support
"""

from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from PIL import Image
import io
import json
import base64
import uuid
from datetime import datetime
import numpy as np
import cv2
import tempfile
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

from model_handler import SegmentationModel
from llm_handler import LLMReportGenerator
from utils import detect_soldiers, encode_image_to_base64, overlay_mask_on_image
from firestore_handler import firestore_handler
from firebase_storage_handler import firebase_storage_handler
from moraqib_rag import moraqib_rag

app = FastAPI(title="Mirqab API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model = SegmentationModel()
llm = LLMReportGenerator()

# API Key for Raspberry Pi authentication
MIRQAB_API_KEY = os.getenv("MIRQAB_API_KEY", "development-key-change-in-production")

@app.on_event("startup")
async def startup_event():
    print("🚀 Starting Mirqab Backend...")
    model.load_model()
    
    # Initialize Firestore
    if os.getenv("FIREBASE_CREDENTIALS_PATH"):
        firestore_handler.initialize()
        firebase_storage_handler.initialize()
    else:
        print("⚠️  Firebase credentials not configured - Pi reporting disabled")
    
    print("✅ Ready for automatic AI report generation!")

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "model_loaded": model.is_loaded(),
        "gemini_api_available": llm.check_connection()
    }

@app.post("/api/analyze_media")
async def analyze_media(
    file: UploadFile = File(...),
    location: str = Form(None)
):
    """
    Complete image analysis with automatic AI report generation and PDF support.
    Returns full report structure compatible with ReportModal and PDF generator.
    """
    try:
        # Parse location
        location_data = json.loads(location) if location else {"lat": "N/A", "lng": "N/A"}
        
        # Read and prepare image
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert("RGB")
        
        # Perform soldier detection
        print("🔍 Analyzing image for camouflaged soldiers...")
        mask, instances = model.predict(image)
        
        # Count soldiers, civilians, and total from mask (DeepLabV3 semantic segmentation)
        soldier_count = 0
        civilian_count = 0
        total_detections = 0
        
        # For DeepLabV3, instances is actually the segmentation map
        # Count soldiers from connected components in the binary mask
        if np.any(mask > 0):
            num_labels, labels, stats, _ = cv2.connectedComponentsWithStats(mask, connectivity=8)
            min_area = 100
            soldier_count = sum(1 for i in range(1, num_labels) if stats[i, cv2.CC_STAT_AREA] >= min_area)
            total_detections = soldier_count
            # DeepLabV3 doesn't detect civilians in this configuration
            civilian_count = 0
        
        # Generate detection objects for API response (always uses instances)
        detections = detect_soldiers(mask, instances)
        
        print(f"✅ Detection complete:")
        print(f"   - Camouflage soldiers: {soldier_count}")
        print(f"   - Civilians: {civilian_count}")
        print(f"   - Total detections: {total_detections}")
        
        # Create overlay image
        overlay_image = overlay_mask_on_image(image, mask)
        overlay_base64 = encode_image_to_base64(overlay_image)
        
        # Encode original image with data URI prefix
        buffered = io.BytesIO()
        image.save(buffered, format="JPEG")
        original_base64 = f"data:image/jpeg;base64,{base64.b64encode(buffered.getvalue()).decode('utf-8')}"
        
        # Generate AI analysis automatically
        ai_analysis = None
        if soldier_count > 0:
            print(f"🤖 Generating AI analysis report...")
            try:
                ai_analysis = await llm.generate_report(image)
                print("✅ AI analysis complete!")
            except Exception as e:
                print(f"⚠️ AI analysis failed ({str(e)}), using fallback report")
                ai_analysis = {
                    "summary": f"Detected {soldier_count} camouflaged soldier(s) in the analyzed area. Advanced pattern recognition identified military camouflage patterns.",
                    "environment": "Environment analysis unavailable (LLM offline)",
                    "camouflaged_soldier_count": soldier_count,
                    "soldier_count": soldier_count,
                    "has_camouflage": True,
                    "attire_and_camouflage": "Military camouflage pattern detected",
                    "equipment": "Unable to determine specific equipment (LLM offline)"
                }
        else:
            # No soldiers detected
            ai_analysis = {
                "summary": "No camouflaged soldiers detected in the analyzed area.",
                "environment": "Clear area",
                "camouflaged_soldier_count": 0,
                "has_camouflage": False,
                "attire_and_camouflage": "N/A",
                "equipment": "N/A"
            }
        
        # Check if camouflage was detected - ONLY save reports with camouflaged soldiers
        has_camouflage = ai_analysis.get("has_camouflage", False)
        camouflaged_count = ai_analysis.get("camouflaged_soldier_count", ai_analysis.get("soldier_count", soldier_count))
        
        # If we detected soldiers but AI analysis failed, still consider it camouflage
        if soldier_count > 0 and camouflaged_count == 0:
            camouflaged_count = soldier_count
            has_camouflage = True
        
        if not has_camouflage or camouflaged_count == 0:
            print("⚠️ No camouflaged soldiers detected - skipping report creation")
            return {
                "success": False,
                "message": "No camouflaged soldiers detected. Only camouflaged military personnel are tracked.",
                "has_camouflage": False,
                "detection": False,
                "soldier_count": 0,
                "civilian_count": civilian_count,
                "total_detections": total_detections
            }
        
        # Generate Firestore report first to get the proper report ID
        timestamp = datetime.now().isoformat()
        
        # Format location for report
        report_location = None
        if location_data.get("lat") != "N/A" and location_data.get("lng") != "N/A":
            report_location = {
                "latitude": float(location_data["lat"]),
                "longitude": float(location_data["lng"])
            }
        else:
            report_location = {"latitude": 0, "longitude": 0}
        
        # Save report to Firestore database FIRST to get the proper report ID
        report_id = None
        if firestore_handler.db:
            try:
                print("💾 Saving report to Firestore database...")
                firestore_report_data = {
                    "longitude": report_location["longitude"],
                    "latitude": report_location["latitude"],
                    "environment": ai_analysis.get("environment", "Unknown"),
                    "soldier_count": ai_analysis.get("camouflaged_soldier_count", ai_analysis.get("soldier_count", camouflaged_count)),
                    "attire_and_camouflage": ai_analysis.get("attire_and_camouflage", ai_analysis.get("attire", "Unknown")),
                    "equipment": ai_analysis.get("equipment", "Unknown"),
                    "source_device_id": "Web-Upload"
                }
                report_id = firestore_handler.create_detection_report(firestore_report_data)
                if report_id:
                    print(f"✅ Report saved to Firestore: {report_id}")
                    
                    # Upload images to Firebase Storage
                    if firebase_storage_handler._initialized:
                        print("📸 Uploading images to Firebase Storage...")
                        try:
                            original_url = firebase_storage_handler.upload_image(original_base64, report_id, "original")
                            segmented_url = firebase_storage_handler.upload_image(overlay_base64, report_id, "segmented")
                            
                            # Update Firestore with image URLs
                            if original_url or segmented_url:
                                firestore_handler.db.collection('detection_reports').document(report_id).update({
                                    'image_snapshot_url': original_url or '',
                                    'segmented_image_url': segmented_url or ''
                                })
                                print(f"✅ Images uploaded and URLs updated in Firestore")
                            else:
                                print("⚠️ Failed to upload images to Firebase Storage - bucket may not exist")
                                print("💡 To fix: Enable Firebase Storage in Firebase Console")
                        except Exception as e:
                            print(f"⚠️ Firebase Storage upload failed: {e}")
                            print("💡 To fix: Enable Firebase Storage in Firebase Console")
                    else:
                        print("⚠️ Firebase Storage not initialized - skipping image upload")
                else:
                    print("⚠️ Failed to save report to Firestore")
                    # Fallback to UUID if Firestore fails
                    report_id = str(uuid.uuid4())[:8].upper()
            except Exception as e:
                print(f"⚠️ Error saving to Firestore: {e}")
                # Fallback to UUID if Firestore fails
                report_id = str(uuid.uuid4())[:8].upper()
        else:
            print("⚠️ Firestore not initialized - using temporary report ID")
            # Fallback to UUID if Firestore not available
            report_id = str(uuid.uuid4())[:8].upper()
        
        # Build complete report object with the Firestore report ID
        # Use Firebase field names for consistency
        report_analysis = {
            "summary": ai_analysis.get("summary", ""),
            "environment": ai_analysis.get("environment", "Unknown"),
            "soldier_count": ai_analysis.get("camouflaged_soldier_count", ai_analysis.get("soldier_count", camouflaged_count)),
            "attire_and_camouflage": ai_analysis.get("attire_and_camouflage", ai_analysis.get("attire", "Unknown")),
            "equipment": ai_analysis.get("equipment", "Unknown")
        }
        
        report = {
            "report_id": report_id,
            "timestamp": timestamp,
            "location": report_location,
            "analysis": report_analysis,
            "images": {
                "original_base64": original_base64,
                "masked_base64": overlay_base64
            }
        }
        
        # Return response with both detection data AND complete report
        return {
            "success": True,
            "detection": True,
            "has_camouflage": True,
            "soldier_count": camouflaged_count,
            "civilian_count": civilian_count,
            "total_detections": total_detections,
            "detections": detections,
            "overlay_image": overlay_base64,
            "original_image": original_base64,
            "report": report,  # Complete report for ReportModal and PDF
            "class_breakdown": {
                "camouflage_soldiers": soldier_count,
                "civilians": civilian_count,
                "total": total_detections
            }
        }
    
    except Exception as e:
        print(f"❌ Error in analyze_media: {str(e)}")
        import traceback
        traceback.print_exc()
        return {
            "success": False,
            "error": str(e),
            "detection": False
        }

@app.get("/api/detection-reports")
async def get_detection_reports(
    time_range: str = "24h",
    limit: int = 100,
    offset: int = 0
):
    """
    Get detection reports for the Detection Reports dashboard
    """
    try:
        if not firestore_handler.db:
            return {
                "success": False,
                "error": "Firestore not initialized",
                "detections": []
            }
        
        print(f"📊 Fetching detection reports (time_range: {time_range}, limit: {limit})")
        
        # Get reports from Firestore
        reports = firestore_handler.get_detection_reports(
            time_range=time_range,
            limit=limit,
            offset=offset
        )
        
        # Transform reports to match frontend interface
        detections = []
        for report in reports:
            location = report.get("location", {})
            detection = {
                "report_id": report.get("report_id", ""),
                "timestamp": report.get("timestamp", ""),
                "location": {
                    "latitude": location.get("latitude", 0),
                    "longitude": location.get("longitude", 0)
                },
                "soldier_count": report.get("soldier_count", 0),
                "attire_and_camouflage": report.get("attire_and_camouflage", "Unknown"),
                "environment": report.get("environment", "Unknown"),
                "equipment": report.get("equipment", "Unknown"),
                "image_snapshot_url": report.get("image_snapshot_url", ""),
                "source_device_id": report.get("source_device_id", ""),
                "segmented_image_url": report.get("segmented_image_url", ""),
                # Additional SOC fields
                "severity": "High" if report.get("soldier_count", 0) >= 3 else "Medium" if report.get("soldier_count", 0) >= 2 else "Low",
                "status": "New",
                "assignee": "Unassigned"
            }
            detections.append(detection)
        
        print(f"✅ Retrieved {len(detections)} detection reports")
        
        return {
            "success": True,
            "detections": detections,
            "total": len(detections),
            "time_range": time_range
        }
        
    except Exception as e:
        print(f"❌ Error fetching detection reports: {e}")
        import traceback
        traceback.print_exc()
        return {
            "success": False,
            "error": str(e),
            "detections": []
        }

@app.get("/api/detection-stats")
async def get_detection_stats(time_range: str = "24h"):
    """
    Get detection statistics for KPI cards
    """
    try:
        if not firestore_handler.db:
            return {
                "success": False,
                "error": "Firestore not initialized",
                "stats": {}
            }
        
        print(f"📈 Fetching detection statistics (time_range: {time_range})")
        
        # Get reports for statistics
        reports = firestore_handler.get_detection_reports(time_range=time_range, limit=1000)
        
        total_detections = len(reports)
        critical_alerts = sum(1 for r in reports if r["soldier_count"] >= 3)
        
        # Calculate MTTD and MTTR (mock values for now)
        mttd = "4.5 Hours"
        mttr = "2.1 Days"
        
        # Count by status (mock for now)
        alerts_by_status = {
            "new": total_detections,
            "inProgress": 0,
            "closed": 0
        }
        
        stats = {
            "totalDetections": total_detections,
            "criticalAlerts": critical_alerts,
            "mttd": mttd,
            "mttr": mttr,
            "alertsByStatus": alerts_by_status
        }
        
        print(f"✅ Retrieved detection statistics: {stats}")
        
        return {
            "success": True,
            "stats": stats
        }
        
    except Exception as e:
        print(f"❌ Error fetching detection stats: {e}")
        return {
            "success": False,
            "error": str(e),
            "stats": {}
        }
@app.post("/api/test_segmentation")
async def test_segmentation(file: UploadFile = File(...)):
    """
    Lightweight segmentation for test mode - ONLY returns overlay mask.
    No AI analysis, no reports, no detection counting - just pure segmentation visualization.
    """
    try:
        print("🧪 Test segmentation (overlay only)...")
        
        # Read uploaded image
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        pil_image = Image.fromarray(image_rgb)
        
        # Run segmentation to get binary mask (ignore instances for test mode)
        mask, _ = model.predict(pil_image)
        
        # Create overlay image using utility function
        overlay_image = overlay_mask_on_image(pil_image, mask, alpha=0.5)
        
        # Convert to base64
        buffered = io.BytesIO()
        overlay_image.save(buffered, format="JPEG", quality=70)
        overlay_base64 = f"data:image/jpeg;base64,{base64.b64encode(buffered.getvalue()).decode('utf-8')}"
        
        print("✅ Test overlay generated")
        return {
            "success": True,
            "overlay_image": overlay_base64
        }
    
    except Exception as e:
        print(f"❌ Test segmentation error: {str(e)}")
        import traceback
        traceback.print_exc()
        return {
            "success": False,
            "error": str(e)
        }

@app.post("/api/report_detection")
async def report_detection(data: dict):
    """
    Receive detection report from Raspberry Pi and store in Firestore
    
    Expected JSON payload:
    {
        "source_device_id": "Pi-001-MainHall",
        "detection_type": "Motion",
        "confidence_score": 0.92,
        "summary_text": "Motion detected by front door.",
        "metadata": {
            "object_count": 2,
            "detection_algorithm": "DeepLabV3-ResNet101"
        },
        "image_data": "base64_encoded_image",
        "api_key": "your-api-key"
    }
    """
    try:
        print("📡 Received detection report from Raspberry Pi...")
        
        # Verify API key
        api_key = data.get("api_key", "")
        if api_key != MIRQAB_API_KEY:
            print("❌ Invalid API key")
            return {
                "success": False,
                "error": "Invalid API key"
            }
        
        # Check if Firestore is initialized
        if not firestore_handler._initialized:
            print("❌ Firestore not initialized")
            return {
                "success": False,
                "error": "Database not available"
            }
        
        # Extract report data
        report_data = {
            "source_device_id": data.get("source_device_id", "Unknown"),
            "detection_type": data.get("detection_type", "Unknown"),
            "confidence_score": float(data.get("confidence_score", 0.0)),
            "summary_text": data.get("summary_text", "Detection event"),
            "metadata": data.get("metadata", {})
        }
        
        # Optional: Upload image to Firebase Storage (TODO)
        # For now, we'll skip image storage to keep it simple
        # image_data = data.get("image_data")
        # if image_data:
        #     image_url = upload_to_firebase_storage(image_data, report_id)
        #     report_data["image_snapshot_url"] = image_url
        
        # Create report in Firestore
        report_id = firestore_handler.create_detection_report(report_data)
        
        if report_id:
            print(f"✅ Detection report saved: {report_id}")
            return {
                "success": True,
                "report_id": report_id,
                "timestamp": datetime.now().isoformat(),
                "message": "Report saved successfully"
            }
        else:
            print("❌ Failed to save report")
            return {
                "success": False,
                "error": "Failed to save report to database"
            }
    
    except Exception as e:
        print(f"❌ Error processing Pi report: {str(e)}")
        import traceback
        traceback.print_exc()
        return {
            "success": False,
            "error": str(e)
        }

@app.post("/api/process_video")
async def process_video(file: UploadFile = File(...)):
    """
    Process video file with frame-by-frame segmentation overlay.
    Returns the processed video with red overlay on detected soldiers.
    """
    try:
        print("🎬 Starting video processing...")
        
        # Save uploaded video to temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.mp4') as temp_input:
            contents = await file.read()
            temp_input.write(contents)
            input_path = temp_input.name
        
        # Create output path
        output_path = tempfile.mktemp(suffix='_processed.mp4')
        
        # Open video
        cap = cv2.VideoCapture(input_path)
        
        # Get video properties
        fps = int(cap.get(cv2.CAP_PROP_FPS))
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        
        print(f"📊 Video info: {width}x{height} @ {fps}fps, {total_frames} frames")
        
        # Create video writer
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))
        
        frame_count = 0
        
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
            
            frame_count += 1
            
            try:
                # Convert BGR to RGB for model
                frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                pil_frame = Image.fromarray(frame_rgb)
                
                # Run segmentation (ignore instances for video processing)
                mask, _ = model.predict(pil_frame)
                
                # Create overlay (will return original frame if mask is invalid)
                overlay_pil = overlay_mask_on_image(pil_frame, mask, alpha=0.5)
                overlay_frame = np.array(overlay_pil)
                
                # Convert RGB back to BGR for video writer
                overlay_bgr = cv2.cvtColor(overlay_frame, cv2.COLOR_RGB2BGR)
                
                # Write frame
                out.write(overlay_bgr)
                
            except Exception as e:
                print(f"⚠️ Warning: Error processing frame {frame_count}: {str(e)}")
                print(f"   Skipping overlay and writing original frame")
                # Write original frame if processing fails
                out.write(frame)
            
            # Progress update every 30 frames
            if frame_count % 30 == 0:
                progress = (frame_count / total_frames) * 100
                print(f"⏳ Progress: {frame_count}/{total_frames} frames ({progress:.1f}%)")
        
        # Release resources
        cap.release()
        out.release()
        
        print(f"✅ Video processing complete: {frame_count} frames processed")
        
        # Clean up input file
        os.unlink(input_path)
        
        # Return processed video
        return FileResponse(
            output_path,
            media_type="video/mp4",
            filename="segmented_video.mp4",
            headers={"Content-Disposition": "attachment; filename=segmented_video.mp4"}
        )
    
    except Exception as e:
        print(f"❌ Video processing error: {str(e)}")
        import traceback
        traceback.print_exc()
        return {
            "success": False,
            "error": str(e)
        }

@app.post("/api/moraqib_query")
async def moraqib_query(query: str = Form(...)):
    """
    Moraqib RAG Assistant - Query detection reports using natural language
    
    This endpoint implements Retrieval-Augmented Generation (RAG):
    1. Retrieves relevant detection reports from Firestore
    2. Augments context with report data
    3. Generates natural language answer using Google Gemini
    
    Strict Guardrails:
    - Only answers questions based on detection reports
    - Refuses general knowledge or off-topic questions
    - Always cites report IDs in responses
    
    Args:
        query: Natural language question (e.g., "How many detections yesterday?")
    
    Returns:
        JSON response with answer and metadata
    """
    try:
        print(f"\n{'='*60}")
        print(f"🔮 MORAQIB RAG QUERY")
        print(f"{'='*60}")
        print(f"Question: {query}")
        
        # Check Firestore initialization
        if not firestore_handler.db:
            return {
                "success": False,
                "error": "Database not initialized. Please configure Firebase first."
            }
        
        # Process query through RAG pipeline
        result = await moraqib_rag.query(query)
        
        print(f"\n{'='*60}")
        print(f"✅ MORAQIB RESPONSE READY")
        print(f"{'='*60}")
        
        return result
    
    except Exception as e:
        print(f"❌ Moraqib endpoint error: {str(e)}")
        import traceback
        traceback.print_exc()
        
        return {
            "success": False,
            "question": query,
            "answer": "I'm sorry, I encountered an error processing your question.",
            "error": str(e)
        }

if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting Mirqab Backend Server...")
    uvicorn.run(app, host="0.0.0.0", port=8000)

