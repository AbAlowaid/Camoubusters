# 🎯 Mirqab - Advanced Camouflage Detection System

A full-stack AI-powered web application for real-time detection and segmentation of camouflaged soldiers using DeepLabV3 deep learning model with automatic AI report generation and intelligent RAG (Retrieval-Augmented Generation) system.

![Python](https://img.shields.io/badge/Python-3.9+-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-14-black.svg)
![FastAPI](https://img.shields.io/badge/FastAPI-0.109-green.svg)
![License](https://img.shields.io/badge/License-MIT-yellow.svg)

## 📋 Table of Contents

- [Features](#-features)
- [Project Structure](#-project-structure)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Usage](#-usage)
- [RAG Evaluation System](#-rag-evaluation-system)
- [API Endpoints](#-api-endpoints)
- [Technologies](#-technologies)
- [Troubleshooting](#-troubleshooting)

## ✨ Features

### 🔍 **Image Upload Analysis**
- Drag-and-drop image upload
- Automatic soldier detection using DeepLabV3
- AI-powered detailed analysis reports
- Red overlay visualization on detected soldiers
- Downloadable PDF reports with complete metadata

### 📹 **Real-time Webcam Detection**
- Live video feed processing
- Automatic alert system when soldiers detected
- Real-time report generation with GPS location
- Audio/visual alerts
- Detection history log

### 🤖 **AI-Powered Reports**
Each detection automatically generates:
- Report ID and timestamp
- Geographic coordinates (GPS)
- AI analysis including:
  - Situation summary
  - Environment description
  - Soldier count estimation
  - Attire and camouflage details
  - Visible equipment analysis
- Original and segmented images
- Professional PDF export

### 🧠 **Moraqib RAG Assistant**
- Natural language querying of detection reports
- Intelligent retrieval of relevant information
- Context-aware responses with strict guardrails
- Time-based filtering (yesterday, last week, etc.)
- Device-specific queries
- Semantic search capabilities

### 📊 **RAG Evaluation System**
- Comprehensive testing with 20+ test queries
- Quality scoring (1-10 scale)
- Performance metrics tracking
- PromptLayer integration for detailed analytics
- Web dashboard for results visualization
- Automated evaluation reports

## 📁 Project Structure

```
Camouflage_Project/
├── backend/                    # FastAPI Backend
│   ├── main.py                # Main API server (auto AI reports)
│   ├── model_handler.py       # DeepLabV3 model loader
│   ├── llm_handler.py         # Google Gemini integration
│   ├── moraqib_rag.py         # RAG system with PromptLayer
│   ├── rag_evaluation.py      # RAG evaluation script
│   ├── evaluation_dashboard.py # Web dashboard for results
│   ├── run_evaluation.py      # Quick evaluation runner
│   ├── firestore_handler.py   # Database operations
│   ├── firebase_storage_handler.py # Image storage
│   └── utils.py               # Detection & image utilities
├── frontend/                   # Next.js 14 Frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx           # Landing page
│   │   │   ├── upload/page.tsx    # Image upload
│   │   │   ├── moraqib/page.tsx   # RAG assistant interface
│   │   │   ├── detection-reports/page.tsx # Reports dashboard
│   │   │   └── about/page.tsx     # About page
│   │   ├── components/
│   │   │   ├── Navbar.tsx         # Navigation
│   │   │   ├── ReportModal.tsx    # Report display
│   │   │   └── DetectionReports/  # Reports components
│   │   └── utils/
│   │       └── pdfGenerator.ts    # PDF export
│   ├── package.json
│   └── .env.local             # API URL configuration
├── model_files/                # DeepLabV3 Model Files
│   ├── config.json
│   ├── model.safetensors      # 85.9 MB model weights
│   └── preprocessor_config.json
├── raspberry_pi/              # Pi deployment scripts
│   ├── mirqab_pi_detector.py
│   └── requirements.txt
├── venv/                       # Python virtual environment
├── requirements.txt            # Python dependencies
└── README.md
```

## 🔧 Prerequisites

- **Python**: 3.9 or higher
- **Node.js**: 18 or higher
- **RAM**: 4+ GB available
- **Disk Space**: 2+ GB free
- **Google Gemini API Key**: For AI analysis
- **Firebase Project**: For database and storage
- **PromptLayer API Key**: For RAG evaluation (optional)

## 🚀 Installation

### Step 1: Clone and Setup

```powershell
cd "C:\Users\dxgam\OneDrive\سطح المكتب\Camouflage_Project"
```

### Step 2: Move Model Files

**IMPORTANT:** Move the following files to the `model_files/` directory:
- `config.json`
- `model.safetensors`
- `preprocessor_config.json`

```powershell
# Create model_files directory
New-Item -ItemType Directory -Force -Path ".\model_files"

# Move the model files
Move-Item -Path ".\config.json" -Destination ".\model_files\" -Force
Move-Item -Path ".\model.safetensors" -Destination ".\model_files\" -Force
Move-Item -Path ".\preprocessor_config.json" -Destination ".\model_files\" -Force
```

### Step 3: Backend Setup

```powershell
# Create and activate virtual environment
python -m venv venv
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
echo "GEMINI_API_KEY=your_gemini_api_key_here" > .env
echo "PROMPTLAYER_API_KEY=pl_5a6ca0f6691aba14d471d2bbb45f9ace" >> .env
echo "FIREBASE_CREDENTIALS_PATH=./mirqab-9de3f-firebase-adminsdk-fbsvc-c77d3822ec.json" >> .env

# Start the backend server
cd backend
python main.py
```

The backend will run on `http://localhost:8000`

### Step 4: Frontend Setup

Open a new PowerShell terminal:

```powershell
cd "C:\Users\dxgam\OneDrive\سطح المكتب\Camouflage_Project\frontend"

# Install dependencies
npm install

# Create environment file
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local

# Start development server
npm run dev
```

The frontend will run on `http://localhost:3000`

## ▶️ Usage

### Main Application

1. **Main Page** (`/`): View project information and model performance metrics
2. **Upload Page** (`/upload`): Upload images or videos for soldier detection analysis
3. **Moraqib Assistant** (`/moraqib`): Query detection reports using natural language
4. **Detection Reports** (`/detection-reports`): View and manage all detection reports
5. **About Page** (`/about`): Learn about the development team

### Image/Video Upload Analysis
- Drag-and-drop upload for images (JPG, PNG) and videos (MP4)
- Automatic segmentation using the DeepLabV3 model
- AI-generated detailed reports using Google Gemini
- Downloadable PDF reports with detection results

### Real-time Webcam Detection
- Live video feed analysis
- Automatic alert system when soldiers are detected
- Real-time report generation with timestamps and geolocation
- Audio alerts (mutable)
- Report log with PDF export capability

### AI-Powered Reports
Each detection generates a comprehensive JSON report containing:
- Report ID and timestamp
- Geographic location (if permitted by user)
- AI analysis including:
  - Environment description
  - Estimated soldier count
  - Attire and camouflage pattern details
  - Visible equipment
- Original and segmented images (base64)

## 🧠 RAG Evaluation System

The Mirqab system includes a comprehensive RAG evaluation framework with PromptLayer integration for detailed performance analytics.

### Quick Evaluation

```powershell
cd backend
python run_evaluation.py
```

### Full Evaluation Script

```powershell
cd backend
python rag_evaluation.py
```

### Web Dashboard

```powershell
cd backend
python evaluation_dashboard.py
# Visit: http://localhost:8001
```

### Evaluation Features

**Test Query Categories:**
- **Basic Queries**: "How many detections?", "Show me all reports"
- **Time-Filtered**: "Yesterday's detections", "Last week's activity"
- **Specific Search**: "Woodland detections", "Camouflage reports"
- **Analytical**: "Which device has most detections?", "Average soldier count"
- **Edge Cases**: Tests guardrails with off-topic questions

**Metrics Tracked:**
- ✅ Success rate
- ⏱️ Response time
- 📊 Quality score (1-10)
- 📚 Reports used
- 🎯 Category performance

**PromptLayer Integration:**
- Track every RAG query with detailed metadata
- Log performance metrics (latency, token usage)
- Record prompt templates and responses
- Generate evaluation reports automatically

**View Results:**
- **Local Dashboard**: http://localhost:8001
- **PromptLayer Dashboard**: https://promptlayer.com/dashboard
- **JSON Reports**: Saved as `rag_evaluation_YYYYMMDD_HHMMSS.json`

## 📡 API Endpoints

### Health Check
```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "model_loaded": true,
  "gemini_api_available": true
}
```

### Analyze Image
```http
POST /api/analyze_media
Content-Type: multipart/form-data

{
  "file": <image_file>,
  "location": "{\"lat\": 24.7136, \"lng\": 46.6753}"
}
```

**Response:**
```json
{
  "success": true,
  "detection": true,
  "soldier_count": 2,
  "detections": [...],
  "overlay_image": "data:image/jpeg;base64,...",
  "original_image": "data:image/jpeg;base64,...",
  "report": {
    "report_id": "A1B2C3D4",
    "timestamp": "2025-10-18T12:34:56",
    "location": {"latitude": 24.7136, "longitude": 46.6753},
    "analysis": {
      "summary": "Detected 2 camouflaged personnel...",
      "environment": "Dense forest terrain",
      "soldier_count": 2,
      "attire_and_camouflage": "Woodland camouflage...",
      "equipment": "Rifles, backpacks..."
    },
    "images": {
      "original_base64": "data:image/jpeg;base64,...",
      "masked_base64": "data:image/jpeg;base64,..."
    }
  }
}
```

### Moraqib RAG Query
```http
POST /api/moraqib_query
Content-Type: application/x-www-form-urlencoded

query=How many detections yesterday?
```

**Response:**
```json
{
  "success": true,
  "question": "How many detections yesterday?",
  "answer": "Based on the available reports, I found 3 detections from yesterday...",
  "reports_count": 3,
  "reports_used": ["MIR-20251024-0001", "MIR-20251024-0002", "MIR-20251024-0003"]
}
```

### Get Detection Reports
```http
GET /api/detection-reports?time_range=24h&limit=100
```

### Get Detection Statistics
```http
GET /api/detection-stats?time_range=24h
```

## 🛠️ Technologies

### Backend
- **FastAPI** 0.109.0 - Modern Python web framework
- **Transformers** 4.37.0 - Hugging Face models
- **PyTorch** 2.1.2 - Deep learning
- **OpenCV** 4.9.0 - Image processing
- **Pillow** 10.2.0 - Image manipulation
- **Google Gemini** 2.5 Flash - AI analysis
- **PromptLayer** 0.3.5 - RAG evaluation
- **Firebase** - Database and storage
- **Uvicorn** 0.27.0 - ASGI server

### Frontend
- **Next.js** 14.1.0 - React framework
- **TypeScript** 5 - Type safety
- **Tailwind CSS** 3.4 - Styling
- **Axios** 1.6 - HTTP client
- **jsPDF** 2.5 - PDF generation
- **Leaflet** 1.9.4 - Maps integration

### AI/ML
- **DeepLabV3** (ResNet-101 backbone) - Semantic segmentation
- **Google Gemini** 2.5 Flash - Vision-language model
- **PromptLayer** - RAG evaluation and analytics

## 🐛 Troubleshooting

### Backend Issues

**❌ Error: Model files not found**
```
Solution: Ensure model_files/ contains config.json, model.safetensors, preprocessor_config.json
```

**❌ Error: Port 8000 already in use**
```powershell
# Find process using port 8000
netstat -ano | findstr :8000

# Kill the process (replace PID)
taskkill /PID <PID> /F
```

**❌ Error: No module named 'transformers'**
```powershell
# Activate venv and reinstall
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

**❌ Error: Gemini API key not found**
```
Solution: Set GEMINI_API_KEY in .env file or environment variables
```

### Frontend Issues

**❌ Error: Failed to fetch from API**
```
Solution: Verify backend is running on http://localhost:8000
Check frontend/.env.local has: NEXT_PUBLIC_API_URL=http://localhost:8000
```

**❌ Error: Images not displaying in report**
```
Solution: This is fixed with Blob URLs. Clear browser cache (Ctrl+Shift+Delete)
```

**❌ Error: Port 3000 already in use**
```powershell
# Kill Node process
taskkill /F /IM node.exe
```

### RAG Evaluation Issues

**❌ Error: PromptLayer not installed**
```powershell
pip install promptlayer
```

**❌ Error: No detection reports found**
```
Solution: Ensure Firebase is configured and has detection data
```

### Performance Issues

**Slow detection (>5 seconds)**
- CPU usage is normal (no GPU acceleration on Windows)
- Expected: 1-2 seconds per image
- For faster results: Use Google Colab with T4 GPU

**Out of memory**
- Close other applications
- Restart backend server
- Minimum 4GB RAM required

---

## 📝 License

MIT License - Free to use and modify

---

## 👥 Team

**Data Science & Machine Learning Bootcamp at Tuwaiq Academy**

- **Saif Alotaibi** - Team Leader
- **Fatimah Alsubaie** - Data Scientist
- **Abdulrahman Attar** - Data Analyst
- **Mousa Alotowi** - Data Scientist
- **Abdulelah Alowaid** - Data Scientist

### 🏢 Project Beneficiaries

This system is designed to benefit key defense and security organizations in Saudi Arabia:

- **SAMI** (Saudi Arabian Military Industries) - Defense manufacturing capabilities
- **GAMI** (General Authority for Military Industries) - Defense sector development
- **SAFCSP** (Saudi Federation for Cybersecurity, Programming and Drones) - Cybersecurity and technology advancement

---

## 🎯 Quick Start Summary

```powershell
# Terminal 1 - Backend
cd backend
python main.py

# Terminal 2 - Frontend  
cd frontend
npm run dev

# Terminal 3 - RAG Evaluation (Optional)
cd backend
python run_evaluation.py

# Browser
http://localhost:3000
```

**Upload an image → Get instant AI report with PDF download!** 🚀

---

## 📌 Important Notes

- ✅ Backend auto-generates AI reports on every detection
- ✅ PDF export includes all metadata and images
- ✅ RAG system with natural language querying
- ✅ Comprehensive evaluation framework with PromptLayer
- ✅ GPS location included in reports (if browser permits)
- ✅ Real-time webcam detection with audio alerts
- ✅ Detection history with downloadable reports
- ✅ Firebase integration for data persistence

For detailed fixes and changes, see `REPORT_SYSTEM_FIX.md`

---

**Status: ✅ Production Ready** | **Version: 2.0** | **Last Updated: January 2025**