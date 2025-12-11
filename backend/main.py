"""
Mirqab Backend - Main FastAPI Application
Automatic AI Report Generation with Complete PDF Export Support
"""

from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
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
from pathlib import Path
from dotenv import load_dotenv

# ✅ NEW: Load environment variables from project root (not from backend directory)
root_dir = Path(__file__).parent.parent
env_path = root_dir / '.env'
print(f"Loading environment from: {env_path}")
print(f".env exists: {env_path.exists()}")
load_dotenv(dotenv_path=env_path)

# Verify environment is loaded
api_key = os.getenv('GEMINI_API_KEY')
print(f"Gemini API Key loaded: {bool(api_key)}")

from model_handler import SegmentationModel
from llm_handler import LLMReportGenerator
from utils import detect_soldiers, encode_image_to_base64, overlay_mask_on_image
from local_database_handler import local_database_handler
from local_storage_handler import local_storage_handler
from moraqib_rag import initialize_rag
from fastapi.staticfiles import StaticFiles

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

# Initialize Moraqib RAG system
moraqib_rag = None

# API Key for Raspberry Pi authentication
MIRQAB_API_KEY = os.getenv("MIRQAB_API_KEY", "development-key-change-in-production")

# Mount storage directory for serving images
backend_dir = Path(__file__).parent
storage_dir = backend_dir / "storage"
storage_dir.mkdir(exist_ok=True)  # Create storage directory if it doesn't exist
app.mount("/storage", StaticFiles(directory=str(storage_dir)), name="storage")

@app.on_event("startup")
async def startup_event():
    global moraqib_rag
    
    print("🚀 Starting Mirqab Backend...")
    model.load_model()
    
    # Initialize Local Storage and Database
    local_storage_handler.initialize()
    local_database_handler.initialize()
    
    # Initialize Moraqib RAG system
    moraqib_rag = initialize_rag(local_database_handler)
    print("✅ Moraqib RAG system initialized")
    
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
        
        # Generate local database report first to get the proper report ID
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
        
        # Generate unique report ID
        report_id = str(uuid.uuid4())[:8].upper()
        
        # Save report to Local Database
        try:
            print("💾 Saving report to Local Database...")
            
            # Upload images to Local Storage first to get URLs
            original_url = local_storage_handler.upload_image(original_base64, report_id, "original")
            segmented_url = local_storage_handler.upload_image(overlay_base64, report_id, "segmented")
            
            database_report_data = {
                "report_id": report_id,
                "timestamp": timestamp,
                "location": report_location,
                "soldier_count": ai_analysis.get("camouflaged_soldier_count", ai_analysis.get("soldier_count", camouflaged_count)),
                "attire_and_camouflage": ai_analysis.get("attire_and_camouflage", ai_analysis.get("attire", "Unknown")),
                "environment": ai_analysis.get("environment", "Unknown"),
                "equipment": ai_analysis.get("equipment", "Unknown"),
                "image_snapshot_url": original_url or "",
                "segmented_image_url": segmented_url or "",
                "source_device_id": "Web-Upload",
                "ai_summary": ai_analysis.get("summary", "")
            }
            
            success = local_database_handler.save_report(database_report_data)
            if success:
                print(f"✅ Report saved to Local Database: {report_id}")
                if original_url and segmented_url:
                    print(f"✅ Images saved to Local Storage")
            else:
                print("⚠️ Failed to save report to Local Database")
                
        except Exception as e:
            print(f"⚠️ Error saving to Local Database: {e}")
            import traceback
            traceback.print_exc()
        
        # Build complete report object with the report ID
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
        if not local_database_handler._initialized:
            return {
                "success": False,
                "error": "Local Database not initialized",
                "detections": []
            }
        
        print(f"📊 Fetching detection reports (time_range: {time_range}, limit: {limit})")
        
        # Get reports from Local Database
        reports = local_database_handler.get_detection_reports(
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
        if not local_database_handler._initialized:
            return {
                "success": False,
                "error": "Local Database not initialized",
                "stats": {}
            }
        
        print(f"📈 Fetching detection statistics (time_range: {time_range})")
        
        # Get reports for statistics
        reports = local_database_handler.get_detection_reports(time_range=time_range, limit=1000)
        
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
    Receive detection report from Raspberry Pi and store in Local Database
    
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
        
        # Check if Local Database is initialized
        if not local_database_handler._initialized:
            print("❌ Local Database not initialized")
            return {
                "success": False,
                "error": "Database not available"
            }
        
        # Generate unique report ID
        report_id = str(uuid.uuid4())[:8].upper()
        
        # Extract and prepare report data
        image_url = ""
        image_data = data.get("image_data")
        if image_data:
            # Upload image to local storage
            image_url = local_storage_handler.upload_image(image_data, report_id, "detection")
        
        report_data = {
            "report_id": report_id,
            "timestamp": datetime.now().isoformat(),
            "source_device_id": data.get("source_device_id", "Unknown"),
            "soldier_count": data.get("metadata", {}).get("object_count", 0),
            "attire_and_camouflage": data.get("summary_text", "Detection event"),
            "environment": "Unknown",
            "equipment": "Unknown",
            "image_snapshot_url": image_url,
            "location": {"latitude": 0, "longitude": 0}
        }
        
        # Save report to Local Database
        success = local_database_handler.save_report(report_data)
        
        if success:
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
    Process video file with optimized frame-skipping segmentation overlay.
    Returns the processed video with red overlay on detected soldiers.
    Faster processing by analyzing every 3rd frame.
    """
    try:
        print("🎬 Starting fast video processing...")
        
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
        
        # ⚡ OPTIMIZATION: Process every 3rd frame for 3x speed
        frame_skip = 3
        print(f"⚡ Fast mode: Processing every {frame_skip} frames (3x faster)")
        
        # Create video writer
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))
        
        frame_count = 0
        last_mask = None  # Cache last mask for skipped frames
        
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
            
            frame_count += 1
            
            try:
                # ⚡ OPTIMIZATION: Only process every Nth frame
                if frame_count % frame_skip == 1 or last_mask is None:
                    # Convert BGR to RGB for model
                    frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                    pil_frame = Image.fromarray(frame_rgb)
                    
                    # Run segmentation (ignore instances for video processing)
                    mask, _ = model.predict(pil_frame)
                    last_mask = mask  # Cache for next frames
                    
                    # Create overlay
                    overlay_pil = overlay_mask_on_image(pil_frame, last_mask, alpha=0.5)
                else:
                    # ⚡ Reuse last mask for skipped frames (much faster)
                    frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                    pil_frame = Image.fromarray(frame_rgb)
                    overlay_pil = overlay_mask_on_image(pil_frame, last_mask, alpha=0.5)
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
    1. Retrieves relevant detection reports from Local Database
    2. Augments context with report data
    3. Generates natural language answer using Google Gemini 2.5 Flash
    
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
        
        # Check Local Database initialization
        if not local_database_handler._initialized:
            return {
                "success": False,
                "error": "Database not initialized. Please configure local database first."
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

@app.get("/api/fetch-image-base64")
async def fetch_image_base64(url: str):
    """
    Fetch an image from local storage or external URL and return as base64
    This bypasses CORS issues when generating PDFs
    """
    try:
        import requests
        from urllib.parse import urlparse, unquote
        
        print(f"Fetching image from URL: {url}")
        
        # Extract path from full URL if needed
        storage_path = url
        if url.startswith('http://') or url.startswith('https://'):
            parsed = urlparse(url)
            storage_path = parsed.path
            print(f"Extracted path from full URL: {storage_path}")
        
        # Check if it's a local storage path
        if storage_path.startswith('/storage/'):
            print("Detected local storage path, reading from filesystem...")
            
            # Get absolute filesystem path
            file_path = local_storage_handler.get_file_path(storage_path)
            
            if file_path and file_path.exists():
                # Read the image file
                with open(file_path, 'rb') as f:
                    image_bytes = f.read()
                
                # Convert to base64
                image_base64 = base64.b64encode(image_bytes).decode('utf-8')
                
                # Create data URL
                data_url = f"data:image/jpeg;base64,{image_base64}"
                
                print(f"Successfully fetched image from local storage, size: {len(image_base64)} bytes")
                
                return JSONResponse(content={
                    "success": True,
                    "base64": data_url
                })
            else:
                raise HTTPException(status_code=404, detail="Image not found in local storage")
        
        # Fallback to regular HTTP request for external URLs
        print("Using regular HTTP request...")
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        
        # Convert to base64
        image_base64 = base64.b64encode(response.content).decode('utf-8')
        
        # Determine content type
        content_type = response.headers.get('Content-Type', 'image/jpeg')
        
        # Create data URL
        data_url = f"data:{content_type};base64,{image_base64}"
        
        print(f"Successfully fetched image, size: {len(image_base64)} bytes")
        
        return JSONResponse(content={
            "success": True,
            "base64": data_url
        })
        
    except requests.exceptions.RequestException as e:
        print(f"Error fetching image: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=f"Failed to fetch image: {str(e)}")
    except Exception as e:
        print(f"Unexpected error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting Mirqab Backend Server...")
    uvicorn.run(app, host="0.0.0.0", port=8000)

