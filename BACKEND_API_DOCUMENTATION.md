# Mirqab Backend API Documentation

**Version:** 1.0  
**Base URL:** `http://localhost:8000`  
**Framework:** FastAPI  
**AI Models:** Google Gemini 2.5 Flash, DeepLabV3-ResNet101

---

## Table of Contents

1. [Authentication](#authentication)
2. [Health & Status](#health--status)
3. [Image & Video Analysis](#image--video-analysis)
4. [Detection Reports](#detection-reports)
5. [Moraqib RAG Assistant](#moraqib-rag-assistant)
6. [Utility Endpoints](#utility-endpoints)
7. [Error Handling](#error-handling)
8. [Data Models](#data-models)

---

## Authentication

### API Key Authentication
- **Header:** `api_key` in request body for Raspberry Pi endpoints
- **Environment Variable:** `MIRQAB_API_KEY`
- **Default (Development):** `"development-key-change-in-production"`
- **Required for:** `/api/report_detection`

---

## Health & Status

### GET `/health`

Check backend service health and model availability.

**Response:**
```json
{
  "status": "healthy",
  "model_loaded": true,
  "gemini_api_available": true
}
```

**Response Fields:**
- `status` (string): Service status (`"healthy"` or `"unhealthy"`)
- `model_loaded` (boolean): Whether the segmentation model is loaded
- `gemini_api_available` (boolean): Whether Gemini API connection is working

---

## Image & Video Analysis

### POST `/api/analyze_media`

**Primary endpoint** for uploading and analyzing images with automatic AI report generation.

**Request:**
- **Content-Type:** `multipart/form-data`
- **Parameters:**
  - `file` (UploadFile, required): Image file (JPEG, PNG)
  - `location` (string, optional): JSON string with GPS coordinates

**Location Format:**
```json
{
  "lat": "24.7136",
  "lng": "46.6753"
}
```

**Success Response (Camouflaged soldiers detected):**
```json
{
  "success": true,
  "detection": true,
  "has_camouflage": true,
  "soldier_count": 3,
  "civilian_count": 0,
  "total_detections": 3,
  "detections": [
    {
      "bbox": [120, 200, 180, 280],
      "confidence": 0.95,
      "class": "camouflage_soldier"
    }
  ],
  "overlay_image": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
  "original_image": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
  "report": {
    "report_id": "A1B2C3D4",
    "timestamp": "2025-12-11T14:30:00.000Z",
    "location": {
      "latitude": 24.7136,
      "longitude": 46.6753
    },
    "analysis": {
      "summary": "Detected 3 camouflaged soldiers...",
      "environment": "Desert terrain with rocky outcrops",
      "soldier_count": 3,
      "attire_and_camouflage": "Desert camouflage pattern (tan/brown)",
      "equipment": "Tactical gear, communication devices"
    },
    "images": {
      "original_base64": "data:image/jpeg;base64,...",
      "masked_base64": "data:image/jpeg;base64,..."
    }
  },
  "class_breakdown": {
    "camouflage_soldiers": 3,
    "civilians": 0,
    "total": 3
  }
}
```

**Response (No camouflaged soldiers):**
```json
{
  "success": false,
  "message": "No camouflaged soldiers detected. Only camouflaged military personnel are tracked.",
  "has_camouflage": false,
  "detection": false,
  "soldier_count": 0,
  "civilian_count": 0,
  "total_detections": 0
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error message details",
  "detection": false
}
```

**Notes:**
- Images are automatically saved to local storage
- Reports are only created when camouflaged soldiers are detected
- Report ID is generated as 8-character uppercase UUID
- AI analysis uses Google Gemini 2.5 Flash
- Fallback report is generated if AI analysis fails

---

### POST `/api/test_segmentation`

Lightweight segmentation test mode - returns only the overlay mask without AI analysis or report generation.

**Request:**
- **Content-Type:** `multipart/form-data`
- **Parameters:**
  - `file` (UploadFile, required): Image file

**Response:**
```json
{
  "success": true,
  "overlay_image": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error message"
}
```

**Use Case:** Quick visualization testing without full analysis pipeline.

---

### POST `/api/process_video`

Process video files with optimized frame-skipping segmentation overlay.

**Request:**
- **Content-Type:** `multipart/form-data`
- **Parameters:**
  - `file` (UploadFile, required): Video file (MP4)

**Response:**
- **Content-Type:** `video/mp4`
- **Headers:** `Content-Disposition: attachment; filename=segmented_video.mp4`
- Returns processed video file with red overlay on detected soldiers

**Processing Details:**
- Frame skip rate: Every 3rd frame (3x speed boost)
- Cached masks for skipped frames
- Progress logging every 30 frames
- FPS preserved from original video

**Error Response:**
```json
{
  "success": false,
  "error": "Error message"
}
```

**Notes:**
- Large files may take several minutes
- Original video is deleted after processing
- Output uses mp4v codec

---

## Detection Reports

### GET `/api/detection-reports`

Retrieve detection reports for the dashboard with filtering and pagination.

**Query Parameters:**
- `time_range` (string, optional): Time filter
  - Options: `"24h"`, `"7d"`, `"30d"`, `"all"`
  - Default: `"24h"`
- `limit` (integer, optional): Maximum number of reports
  - Default: `100`
- `offset` (integer, optional): Pagination offset
  - Default: `0`

**Response:**
```json
{
  "success": true,
  "detections": [
    {
      "report_id": "A1B2C3D4",
      "timestamp": "2025-12-11T14:30:00.000Z",
      "location": {
        "latitude": 24.7136,
        "longitude": 46.6753
      },
      "soldier_count": 3,
      "attire_and_camouflage": "Desert camouflage pattern",
      "environment": "Desert terrain",
      "equipment": "Tactical gear",
      "image_snapshot_url": "/storage/uploads/A1B2C3D4_original.jpg",
      "segmented_image_url": "/storage/uploads/A1B2C3D4_segmented.jpg",
      "source_device_id": "Web-Upload",
      "severity": "High",
      "status": "New",
      "assignee": "Unassigned"
    }
  ],
  "total": 42,
  "time_range": "24h"
}
```

**Severity Levels:**
- `"High"`: ≥3 soldiers
- `"Medium"`: 2 soldiers
- `"Low"`: 1 soldier

**Error Response:**
```json
{
  "success": false,
  "error": "Error message",
  "detections": []
}
```

---

### GET `/api/detection-stats`

Get detection statistics for KPI cards and dashboard metrics.

**Query Parameters:**
- `time_range` (string, optional): Time filter
  - Default: `"24h"`

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalDetections": 42,
    "criticalAlerts": 8,
    "mttd": "4.5 Hours",
    "mttr": "2.1 Days",
    "alertsByStatus": {
      "new": 42,
      "inProgress": 0,
      "closed": 0
    }
  }
}
```

**KPI Definitions:**
- `totalDetections`: Total number of detection reports
- `criticalAlerts`: Reports with ≥3 soldiers
- `mttd`: Mean Time To Detect (currently mock value)
- `mttr`: Mean Time To Respond (currently mock value)
- `alertsByStatus`: Count by status (currently all "new")

**Error Response:**
```json
{
  "success": false,
  "error": "Error message",
  "stats": {}
}
```

---

### POST `/api/report_detection`

**Raspberry Pi endpoint** for submitting detection reports from edge devices.

**Request:**
- **Content-Type:** `application/json`
- **Body:**
```json
{
  "source_device_id": "Pi-001-MainHall",
  "detection_type": "Motion",
  "confidence_score": 0.92,
  "summary_text": "Motion detected by front door.",
  "metadata": {
    "object_count": 2,
    "detection_algorithm": "DeepLabV3-ResNet101"
  },
  "image_data": "data:image/jpeg;base64,...",
  "api_key": "your-api-key"
}
```

**Required Fields:**
- `api_key` (string): Authentication key

**Optional Fields:**
- `source_device_id` (string): Device identifier
- `detection_type` (string): Type of detection
- `confidence_score` (float): Detection confidence (0-1)
- `summary_text` (string): Brief summary
- `metadata` (object): Additional data
- `image_data` (string): Base64 encoded image

**Response:**
```json
{
  "success": true,
  "report_id": "E5F6G7H8",
  "timestamp": "2025-12-11T14:30:00.000Z",
  "message": "Report saved successfully"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Invalid API key"
}
```

**Notes:**
- Images are automatically uploaded to local storage
- Report ID is auto-generated
- Location defaults to `{latitude: 0, longitude: 0}` if not provided

---

## Moraqib RAG Assistant

### POST `/api/moraqib_query`

Natural language query interface for detection reports using RAG (Retrieval-Augmented Generation).

**Request:**
- **Content-Type:** `multipart/form-data`
- **Parameters:**
  - `query` (string, required): Natural language question

**Example Queries:**
- "How many detections in the last 24 hours?"
- "Show me high-severity alerts from yesterday"
- "What's the average soldier count per detection?"
- "List all detections near coordinates 24.7136, 46.6753"

**Response:**
```json
{
  "success": true,
  "question": "How many detections in the last 24 hours?",
  "answer": "Based on the detection reports, there were 42 detections in the last 24 hours. Here's the breakdown:\n\n- Report A1B2C3D4: 3 soldiers\n- Report B2C3D4E5: 2 soldiers\n- Report C3D4E5F6: 1 soldier\n...",
  "reports_used": [
    {
      "report_id": "A1B2C3D4",
      "timestamp": "2025-12-11T14:30:00.000Z",
      "soldier_count": 3
    }
  ],
  "total_reports": 42
}
```

**Guardrails:**
- Only answers questions based on detection reports
- Refuses general knowledge or off-topic questions
- Always cites report IDs in responses
- Uses Google Gemini 2.5 Flash for generation

**Error Response:**
```json
{
  "success": false,
  "question": "Your question",
  "answer": "I'm sorry, I encountered an error processing your question.",
  "error": "Error details"
}
```

---

## Utility Endpoints

### GET `/api/fetch-image-base64`

Fetch an image from local storage or external URL and return as base64. Used for PDF generation to bypass CORS issues.

**Query Parameters:**
- `url` (string, required): Image URL or path

**Example:**
```
GET /api/fetch-image-base64?url=/storage/uploads/A1B2C3D4_original.jpg
```

**Response:**
```json
{
  "success": true,
  "base64": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
}
```

**Supported Paths:**
- Local storage paths: `/storage/uploads/...` or `/storage/reports/...`
- External URLs: `http://...` or `https://...`

**Error Response:**
```json
{
  "success": false,
  "error": "Image not found in local storage"
}
```

**HTTP Status Codes:**
- `200`: Success
- `404`: Image not found
- `400`: Failed to fetch image
- `500`: Server error

---

### GET `/storage/{path}`

Static file serving for uploaded images and generated reports.

**Examples:**
```
GET /storage/uploads/A1B2C3D4_original.jpg
GET /storage/uploads/A1B2C3D4_segmented.jpg
GET /storage/reports/A1B2C3D4/report.pdf
```

**Response:**
- Direct file download with appropriate `Content-Type`

---

## Error Handling

### Standard Error Response Format

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Detailed error message",
  "detection": false  // For detection endpoints
}
```

### HTTP Status Codes

- `200 OK`: Success
- `400 Bad Request`: Invalid request parameters
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server-side error

### Common Errors

**Database Not Initialized:**
```json
{
  "success": false,
  "error": "Local Database not initialized"
}
```

**Invalid API Key:**
```json
{
  "success": false,
  "error": "Invalid API key"
}
```

**Model Loading Error:**
```json
{
  "success": false,
  "error": "Model not loaded"
}
```

**Image Processing Error:**
```json
{
  "success": false,
  "error": "Failed to process image: [details]"
}
```

---

## Data Models

### Location Object
```typescript
interface Location {
  latitude: number;   // Decimal degrees
  longitude: number;  // Decimal degrees
}
```

### Detection Object
```typescript
interface Detection {
  bbox: [number, number, number, number];  // [x1, y1, x2, y2]
  confidence: number;  // 0.0 - 1.0
  class: string;       // "camouflage_soldier"
}
```

### Analysis Object
```typescript
interface Analysis {
  summary: string;              // AI-generated summary
  environment: string;          // Environmental description
  soldier_count: number;        // Number of soldiers detected
  attire_and_camouflage: string; // Camouflage pattern description
  equipment: string;            // Equipment description
}
```

### Report Object
```typescript
interface Report {
  report_id: string;           // 8-character uppercase UUID
  timestamp: string;           // ISO 8601 format
  location: Location;
  analysis: Analysis;
  images: {
    original_base64: string;   // Data URL format
    masked_base64: string;     // Data URL format
  };
}
```

### Detection Report (Dashboard)
```typescript
interface DetectionReport {
  report_id: string;
  timestamp: string;            // ISO 8601 format
  location: Location;
  soldier_count: number;
  attire_and_camouflage: string;
  environment: string;
  equipment: string;
  image_snapshot_url: string;   // Relative path
  segmented_image_url: string;  // Relative path
  source_device_id: string;
  severity: "Low" | "Medium" | "High";
  status: "New" | "In Progress" | "Closed";
  assignee: string;
}
```

### Statistics Object
```typescript
interface Stats {
  totalDetections: number;
  criticalAlerts: number;      // Reports with ≥3 soldiers
  mttd: string;               // Mean Time To Detect
  mttr: string;               // Mean Time To Respond
  alertsByStatus: {
    new: number;
    inProgress: number;
    closed: number;
  };
}
```

---

## CORS Configuration

The backend allows all origins for development:

```python
allow_origins=["*"]
allow_credentials=True
allow_methods=["*"]
allow_headers=["*"]
```

**Production Note:** Configure specific allowed origins in production.

---

## Environment Variables

Required environment variables (`.env` file in project root):

```bash
# Google Gemini API Key (Required for AI analysis)
GEMINI_API_KEY=your_gemini_api_key_here

# Mirqab API Key (Required for Raspberry Pi authentication)
MIRQAB_API_KEY=your_secure_api_key_here

# Optional: Firebase configuration (if using cloud storage)
FIREBASE_CREDENTIALS_PATH=path/to/firebase-credentials.json
```

---

## Running the Backend

### Development Server

```bash
cd backend
python main.py
```

Server runs on: `http://localhost:8000`

### With Uvicorn

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### Docker (if applicable)

```bash
docker build -t mirqab-backend .
docker run -p 8000:8000 --env-file .env mirqab-backend
```

---

## API Testing Examples

### Using cURL

**Health Check:**
```bash
curl http://localhost:8000/health
```

**Analyze Image:**
```bash
curl -X POST http://localhost:8000/api/analyze_media \
  -F "file=@/path/to/image.jpg" \
  -F 'location={"lat": "24.7136", "lng": "46.6753"}'
```

**Get Detection Reports:**
```bash
curl "http://localhost:8000/api/detection-reports?time_range=24h&limit=10"
```

**Moraqib Query:**
```bash
curl -X POST http://localhost:8000/api/moraqib_query \
  -F "query=How many detections today?"
```

### Using JavaScript (Fetch API)

**Analyze Image:**
```javascript
const formData = new FormData();
formData.append('file', imageFile);
formData.append('location', JSON.stringify({
  lat: '24.7136',
  lng: '46.6753'
}));

const response = await fetch('http://localhost:8000/api/analyze_media', {
  method: 'POST',
  body: formData
});

const result = await response.json();
```

**Get Detection Reports:**
```javascript
const response = await fetch(
  'http://localhost:8000/api/detection-reports?time_range=7d&limit=50'
);
const data = await response.json();
```

---

## Frontend Integration Notes

### Image Upload Component

```typescript
// Example: Upload image and display results
async function uploadAndAnalyze(file: File, location?: {lat: string, lng: string}) {
  const formData = new FormData();
  formData.append('file', file);
  
  if (location) {
    formData.append('location', JSON.stringify(location));
  }
  
  const response = await fetch('http://localhost:8000/api/analyze_media', {
    method: 'POST',
    body: formData
  });
  
  const result = await response.json();
  
  if (result.success && result.detection) {
    // Show report modal with result.report
    showReportModal(result.report);
    
    // Display overlay image
    displayImage(result.overlay_image);
  } else {
    // Show "No detections" message
    showMessage(result.message);
  }
}
```

### Detection Reports Dashboard

```typescript
// Example: Fetch and display reports
async function loadDetectionReports(timeRange: string = '24h') {
  const response = await fetch(
    `http://localhost:8000/api/detection-reports?time_range=${timeRange}`
  );
  
  const data = await response.json();
  
  if (data.success) {
    // Update table with data.detections
    updateDetectionTable(data.detections);
    
    // Update KPI cards
    loadStats(timeRange);
  }
}

async function loadStats(timeRange: string) {
  const response = await fetch(
    `http://localhost:8000/api/detection-stats?time_range=${timeRange}`
  );
  
  const data = await response.json();
  
  if (data.success) {
    // Update KPI cards with data.stats
    updateKPICards(data.stats);
  }
}
```

### Moraqib Assistant Integration

```typescript
// Example: Query Moraqib
async function askMoraqib(question: string) {
  const formData = new FormData();
  formData.append('query', question);
  
  const response = await fetch('http://localhost:8000/api/moraqib_query', {
    method: 'POST',
    body: formData
  });
  
  const result = await response.json();
  
  if (result.success) {
    // Display answer in chat interface
    displayAnswer(result.answer);
    
    // Optionally show source reports
    if (result.reports_used) {
      displaySourceReports(result.reports_used);
    }
  }
}
```

---

## Rate Limiting & Performance

### Current Limitations

- No rate limiting implemented
- Synchronous video processing (blocking)
- Large file uploads may timeout

### Recommended Limits

- Image size: ≤10MB
- Video size: ≤100MB
- Concurrent requests: ≤10
- Moraqib queries: ≤60/hour (respects Gemini API limits)

### Performance Tips

- Use `/api/test_segmentation` for quick preview
- Compress images before upload
- Use pagination for large report datasets
- Cache detection stats on frontend

---

## Security Considerations

### API Key Management
- Never commit API keys to version control
- Use `.env` files (excluded from git)
- Rotate keys regularly in production

### Input Validation
- File type validation (JPEG, PNG, MP4)
- File size limits
- SQL injection protection (parameterized queries)

### CORS
- Configure specific origins in production
- Disable credentials for public endpoints

### Data Privacy
- Images stored locally (not cloud by default)
- Reports contain sensitive detection data
- Implement access controls in production

---

## Changelog

### Version 1.0 (Current)
- Initial API release
- Image and video analysis
- Detection reports dashboard
- Moraqib RAG assistant
- Local storage integration
- Raspberry Pi reporting endpoint

---

## Support & Contact

For issues or questions:
- GitHub Repository: [AbAlowaid/Mirqab](https://github.com/AbAlowaid/Mirqab)
- Documentation: See `README.md` and `SECURITY_SETUP.md`

---

**Last Updated:** December 11, 2025
