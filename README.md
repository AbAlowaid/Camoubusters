# Camoubusters - Advanced AI-Powered Camouflage Detection System

An advanced AI-powered camouflage soldier detection system designed to identify camouflaged soldiers in real time across multiple terrains and environments. Camoubusters enhances situational awareness, supports security teams, and improves rapid-response decision-making by transforming raw visual inputs into structured, actionable intelligence using computer vision models combined with vision-language capabilities.

![Python](https://img.shields.io/badge/Python-3.9+-blue.svg)
![React](https://img.shields.io/badge/React-18-blue.svg)
![FastAPI](https://img.shields.io/badge/FastAPI-0.109-green.svg)
![PyTorch](https://img.shields.io/badge/PyTorch-2.0+-red.svg)
![Firebase](https://img.shields.io/badge/Firebase-Admin-orange.svg)

---

## 📚 Documentation Quick Links

- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Quick 5-minute setup guide
- **[SECURITY_SETUP.md](./SECURITY_SETUP.md)** - Complete security configuration
- **[PRE_COMMIT_CHECKLIST.md](./PRE_COMMIT_CHECKLIST.md)** - Security checklist before pushing
- **[BACKEND_API_DOCUMENTATION.md](./BACKEND_API_DOCUMENTATION.md)** - Complete API reference

---

## System Overview

Camoubusters is built around three main components that work together to deliver comprehensive camouflage detection and analysis:

### 1. Dashboard - Central Command Center
The Dashboard acts as the command center for all system activity, providing:
- **Real-time KPI Cards**: Detection counts, report statistics, and operational metrics
- **Geographic Overview**: Location-based detection mapping and distribution
- **AI-Generated Summaries**: Vision-Language Model summaries for each detection event
- **Interactive Analytics**: Visual charts and trends analysis
- **Advanced Filtering**: Filter by time range, severity, status, and device
- **Team Management**: Assign detections and track team activity

### 2. Analysis - Deep Investigation
A dedicated page for detailed image analysis:
- **Image Upload**: Upload images for comprehensive AI analysis
- **Camouflage Detection**: Advanced computer vision identifies hidden or partially concealed soldiers
- **Environmental Context**: Recognition of terrain, vegetation, and environmental conditions
- **Weapon Detection**: Identification of weapons and equipment
- **Personnel Estimation**: Accurate count of detected individuals
- **PDF Reports**: Professional report generation with images and metadata

### 3. Assistant - Intelligent RAG System
Conversational AI-powered querying of detection data:
- **Natural Language Queries**: Ask questions in plain language
- **Instant Insights**: Retrieve statistics, summaries, and historical data
- **Pattern Analysis**: Discover trends and anomalies in detection history
- **Context-Aware Responses**: Intelligent answers based on your detection database
- **Efficient Information Access**: No need to navigate multiple pages

## Features

### Detection & Analysis
- **Image Upload Analysis**: Upload images for automatic camouflage soldier detection
- **Real-time Camera Processing**: Live webcam feed processing with automatic report generation
- **Advanced Segmentation**: State-of-the-art semantic segmentation for precise detection
- **GPU & CPU Support**: Optimized for both GPU acceleration and CPU processing
- **Environmental Recognition**: Identify terrain, vegetation, and tactical context

### AI-Powered Intelligence
- **Vision-Language Models**: Advanced image understanding and analysis
- **Smart Report Generation**: Automatic environment, attire, and equipment analysis
- **RAG System**: Retrieval-augmented generation for intelligent queries
- **Contextual Insights**: AI-powered answers based on your detection database
- **Temporal Analysis**: Track trends and patterns over time

### Real-time Features
- **Live Detection**: Continuous monitoring with automatic reporting
- **Smart Cooldown**: Intelligent spam prevention for auto-reports (configurable intervals)
- **Visual Countdown**: Real-time countdown to next report
- **Multi-Device Support**: Track detections from multiple sources
- **Instant Notifications**: Real-time alerts for new detections

### Report Management
- **PDF Export**: Professional reports with images and metadata
- **Firebase Storage**: Automatic cloud storage of detection images
- **Location Tracking**: GPS/IP-based location detection
- **Visual Evidence**: Both original and processed images stored
- **Detailed Metadata**: Comprehensive detection information and timestamps

## Quick Start

### Prerequisites
- Python 3.9+
- Node.js 18+
- OpenAI API Key (for vision-language analysis)
- Firebase Project (for storage and database)
- Trained model file

### Installation

#### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/Camoubusters.git
cd Camoubusters_backend
```

#### 2. Backend Setup
```bash
# Create virtual environment
python -m venv venv
.\venv\Scripts\Activate.ps1  # Windows
# source venv/bin/activate    # Linux/Mac

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
# Create .env file in project root
echo "OPENAI_API_KEY=your_openai_api_key_here" > .env
echo "FIREBASE_CREDENTIALS_PATH=path/to/firebase-credentials.json" >> .env
echo "DEVICE_ID=Main-Detection-Station" >> .env
```

#### 3. Firebase Setup
1. Create a Firebase project at https://console.firebase.google.com
2. Enable Firestore Database and Firebase Storage
3. Download service account credentials JSON file
4. Place it in your project directory
5. Update `FIREBASE_CREDENTIALS_PATH` in `.env`

#### 4. Start Backend Server
```bash
cd backend
python main.py
```
Backend will be available at `http://localhost:8000`

#### 5. Frontend Setup
```bash
cd frontend
npm install

# Create .env file
echo "VITE_API_URL=http://localhost:8000" > .env

# Start development server
npm run dev
```
Frontend will be available at `http://localhost:5173`

## Project Structure

```
Camoubusters_backend/
├── backend/                              # FastAPI Backend
│   ├── main.py                          # Main API server
│   ├── model_handler.py                 # Deep learning model handler
│   ├── llm_handler.py                   # Vision-Language Model integration
│   ├── moraqib_rag.py                   # RAG system for intelligent queries
│   ├── firestore_handler.py             # Firebase Firestore operations
│   ├── firebase_storage_handler.py      # Firebase Storage integration
│   ├── local_database_handler.py        # Local database operations
│   ├── local_storage_handler.py         # Local storage management
│   ├── utils.py                         # Utility functions
│   ├── evaluation_dashboard.py          # Model evaluation interface
│   ├── rag_evaluation.py                # RAG system evaluation
│   └── templates/                       # HTML templates
├── frontend/                             # React/Vite Frontend
│   ├── src/
│   │   ├── components/                  # React components
│   │   │   ├── Header.tsx              # Header navigation
│   │   │   ├── Sidebar.tsx             # Sidebar navigation
│   │   │   ├── DetectionCard.tsx       # Detection display card
│   │   │   ├── StatsCard.tsx           # Statistics card
│   │   │   └── ui/                     # UI component library
│   │   ├── pages/                       # Page components
│   │   │   ├── Dashboard.tsx           # Main dashboard
│   │   │   ├── AnalyzePage.tsx         # Image analysis page
│   │   │   ├── AssistantPage.tsx       # RAG assistant page
│   │   │   ├── ReportsPage.tsx         # Reports management
│   │   │   └── Index.tsx               # Home page
│   │   ├── contexts/                    # React contexts
│   │   │   └── LanguageContext.tsx     # Language/i18n context
│   │   ├── hooks/                       # Custom React hooks
│   │   ├── lib/                         # Utilities and helpers
│   │   │   ├── api.ts                  # API client
│   │   │   ├── i18n.ts                 # Internationalization
│   │   │   └── utils.ts                # Helper functions
│   │   └── utils/
│   │       └── pdfGenerator.ts         # PDF generation utility
│   └── public/                          # Static assets
├── realtime_camera_detection.py          # Real-time camera detection script
├── segmentation.py                       # Image segmentation script
├── requirements.txt                      # Python dependencies
├── docker-compose.yml                    # Docker Compose configuration
├── .env                                 # Environment variables
├── README.md                            # This file
├── BACKEND_API_DOCUMENTATION.md         # API documentation
└── SECURITY_SETUP.md                    # Security configuration guide
```

## Technologies

### Backend
- **FastAPI**: High-performance async API framework
- **PyTorch**: Deep learning framework
- **Semantic Segmentation**: Advanced computer vision model
- **Vision-Language Models**: Image understanding and analysis
- **Firebase Admin SDK**: Cloud database and storage
- **LangChain**: RAG system implementation
- **FAISS**: Vector similarity search for RAG

### Frontend
- **React 18**: Modern UI framework
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS**: Utility-first CSS framework
- **Vite**: Fast build tool and development server
- **Chart.js**: Interactive charts and visualizations
- **jsPDF**: PDF generation and reporting

### AI/ML
- **Semantic Segmentation**: Pixel-level camouflage detection
- **Vision-Language Models**: Contextual image understanding
- **Vector Embeddings**: Semantic search and RAG
- **FAISS**: Efficient similarity search

## API Endpoints

### Detection & Analysis
- `POST /api/analyze_media` - Analyze uploaded image
- `POST /api/report_detection` - Create new detection report
- `POST /api/test_segmentation` - Test segmentation on image

### Reports Management
- `GET /api/detection-reports` - Get all detection reports with filters
- `GET /api/detection-stats` - Get detection statistics
- `GET /api/fetch-image-base64` - Fetch images for report generation

### AI Assistant
- `POST /api/moraqib_query` - Query reports using natural language

### System
- `GET /health` - Health check and system status

## Key Features Explained

### 1. Real-time Detection
Run detection scripts for continuous monitoring:
```bash
python realtime_camera_detection.py
# or
python segmentation.py
```
- Detects camouflaged soldiers in real-time
- Automatically generates reports at configurable intervals
- Uploads images to Firebase Storage
- Stores reports in Firestore
- Visual countdown to next report

### 2. Intelligent RAG Assistant
The Assistant component provides natural language interaction with your detection data:
- Ask questions like "How many detections were made today?"
- Query by location, time, environment, or equipment
- Get AI-powered insights and pattern analysis
- Fast information retrieval without manual navigation

### 3. SOC-Style Dashboard
Professional security operations center interface:
- Real-time KPI metrics
- Interactive analytics and charts
- Filterable detection table
- Status and severity tracking
- Geographic distribution visualization
- Team assignment and management

### 4. Analysis & Investigation
Deep-dive analysis for individual detections:
- Upload images for comprehensive analysis
- Identify camouflaged soldiers and equipment
- Recognize environmental context
- Generate professional PDF reports
- Store evidence and metadata

## Configuration

### Environment Variables

**Root `.env` file:**
```env
OPENAI_API_KEY=your_openai_api_key_here
FIREBASE_CREDENTIALS_PATH=./backend/firebase-credentials.json
DEVICE_ID=Main-Detection-Station
```

**Frontend `.env` file:**
```env
VITE_API_URL=http://localhost:8000
```

### Firebase Setup
1. Create Firestore collection: `detection_reports`
2. Enable Firebase Storage bucket
3. Configure storage security rules
4. Download and place service account credentials

## Usage Examples

### Upload Image for Analysis
1. Navigate to Analysis page
2. Select or drag & drop an image
3. Wait for AI analysis
4. Review detailed report
5. Download PDF report

### Real-time Monitoring
```bash
python realtime_camera_detection.py
```
System will monitor the camera feed and generate reports automatically.

### Query with Assistant
1. Navigate to Assistant page
2. Ask natural language questions:
   - "What detections occurred today?"
   - "Show me detections in forest environments"
   - "What was the average soldier count per report?"
   - "List all detections near location X"

## Development Team

**Data Science & Machine Learning Bootcamp - Tuwaiq Academy 2025**

- **Basim Aldawood** - Data Scientist & Team Lead
- **Nawaf Aljubair** - Data Scientist
- **Bader Aljobairy** - Data Analyst
- **Mohannad Alduwish** - Data Scientist
- **Abdulelah Alowaid** - Data Scientist

## Project Beneficiaries

This system is designed to benefit key defense and security organizations in Saudi Arabia:

- **SAMI** - Saudi Arabian Military Industries
- **GAMI** - General Authority for Military Industries
- **SAFCSP** - Saudi Federation for Cybersecurity, Programming and Drones

## License

This project is developed as part of the Data Science & ML Bootcamp at Tuwaiq Academy.

## Contributing

This is an educational project developed during the bootcamp. For questions, feedback, or suggestions, please contact the development team.

## Acknowledgments

- Tuwaiq Academy for providing the learning platform and infrastructure
- OpenAI for vision-language capabilities
- Firebase for cloud infrastructure
- PyTorch and computer vision communities
- All instructors and mentors who guided this project

---

**Status: Production Ready** | **Version: 1.0** | **Last Updated: December 2025**

Built by Team Camoubusters at Tuwaiq Academy
