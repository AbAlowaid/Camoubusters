# Camoubusters -- AI-Powered Camouflage Soldier Detection System

Camoubusters is an advanced AI-powered system for detecting camouflaged
soldiers in real time across diverse environments and terrains. It
enhances situational awareness, supports security operations, and
accelerates decision-making by transforming raw visual input into
actionable intelligence. Using state-of-the-art computer vision and
multimodal AI capabilities, Camoubusters identifies hidden or partially
concealed soldiers and automatically generates contextual summaries to
help users interpret each detection event quickly and accurately.

![Python](https://img.shields.io/badge/Python-3.9+-blue.svg)
![FastAPI](https://img.shields.io/badge/FastAPI-0.109-green.svg)
![PyTorch](https://img.shields.io/badge/PyTorch-2.0+-red.svg)
![Firebase](https://img.shields.io/badge/Firebase-Admin-orange.svg)
![React](https://img.shields.io/badge/React-18-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)

## Features

### Detection & Analysis

-   **Upload-Based Image Analysis**: Upload images for AI-powered
    camouflage soldier detection.
-   **Real-Time Detection**: Live camera feed processing for immediate
    soldier identification.
-   **Semantic Segmentation Model**: Advanced AI models trained for
    camouflage recognition.
-   **Optimized Performance**: Supports both GPU acceleration and
    CPU-only environments.

### AI-Powered Intelligence

-   **Vision-Language Model Summaries**: Automatic contextual summaries
    for each detection.
-   **Smart Report Generation**: Extracts environment details, soldier
    count, and visual indicators.
-   **RAG Assistant Integration**: Natural-language querying of
    detection history.
-   **Insightful Analytics**: AI-generated explanations based on user
    data.

### Dashboard (Command Center)

-   **Clean & Centralized Interface**: Overview of detections, reports,
    and activity.
-   **Key Metrics Display**: Soldier count, report frequency, and
    location mapping.
-   **Interactive Visualization**: Charts and maps for operational
    clarity.
-   **Event Summaries**: Automatically generated descriptions for quick
    understanding.

### Report Management

-   **PDF Export**: Generate structured incident reports with images and
    metadata.
-   **Cloud Storage**: Automatic upload of raw and processed images.
-   **Location Logging**: Store GPS/IP data for each detection.
-   **Complete Metadata Tracking**: Environment, threats, time, soldier
    count, and more.

### Real-Time Features

-   **Continuous Monitoring**: Persistent detection pipeline.
-   **Cooldown Mechanisms**: Prevents duplicate detections within short
    intervals.
-   **Live Status Indicators**: Real-time activity, alerts, and
    processing feedback.
-   **Multi-Device Support**: Handle detections from multiple sources.

## Quick Start

### Prerequisites

-   Python 3.9+
-   Node.js 18+
-   OpenAI API Key (for VLM summaries)
-   Firebase Project (for database and storage)
-   Model file: `best_deeplabv3_camouflage.pth`

### Installation

#### 1. Clone the Repository

``` bash
git clone https://github.com/AbAlowaid/Camoubusters.git
cd Camoubusters
```

#### 2. Backend Setup

``` bash
python -m venv venv
.env\Scripts\Activate.ps1   # Windows
# source venv/bin/activate    # Linux/Mac

pip install -r requirements.txt

# Environment variables
echo "OPENAI_API_KEY=your_api_key" > .env
echo "FIREBASE_CREDENTIALS_PATH=path/to/firebase.json" >> .env
echo "DEVICE_ID=Main-Detection-Unit" >> .env
```

#### 3. Firebase Setup

1.  Create project in Firebase Console\
2.  Enable Firestore + Firebase Storage\
3.  Download service account credentials\
4.  Place credentials in your backend directory\
5.  Update `.env` accordingly

#### 4. Start Backend Server

``` bash
cd backend
python main.py
```

API will run at: **http://localhost:8000**

#### 5. Frontend Setup

``` bash
cd frontend
npm install

echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local

npm run dev
```

Frontend will run at: **http://localhost:3000**

## Project Structure

    Camoubusters/
    ├── backend/
    │   ├── main.py
    │   ├── model_handler.py
    │   ├── llm_handler.py
    │   ├── rag_assistant.py
    │   ├── firestore_handler.py
    │   ├── storage_handler.py
    │   └── utils.py
    ├── frontend/
    │   ├── src/
    │   │   ├── app/
    │   │   │   ├── page.tsx
    │   │   │   ├── analysis/
    │   │   │   ├── dashboard/
    │   │   │   ├── assistant/
    │   │   │   └── about/
    │   │   ├── components/
    │   │   │   ├── Navbar.tsx
    │   │   │   ├── ReportCard.tsx
    │   │   │   ├── MapView.tsx
    │   │   │   └── DashboardComponents/
    │   │   └── utils/pdfGenerator.ts
    │   └── public/
    │       └── camoubusters_logo.png
    ├── segmentation.py
    ├── realtime_detection.py
    ├── requirements.txt
    └── README.md

## Technologies

### Backend

-   FastAPI
-   PyTorch (DeepLabV3 / segmentation models)
-   Vision-Language Models (VLM integration)
-   Firebase Admin SDK
-   RAG system (vector search + embeddings)

### Frontend

-   Next.js 14
-   React + TypeScript
-   TailwindCSS
-   Chart.js
-   Leaflet maps
-   jsPDF

### AI/ML

-   Semantic segmentation (DeepLabV3)
-   VLM summarization
-   Vector embeddings + FAISS for RAG
-   Environment/weapon/person detection

## API Endpoints

### Detection & Analysis

-   `POST /api/analyze_media` -- Analyze uploaded image
-   `POST /api/report_detection` -- Create a detection report
-   `POST /api/segment_test` -- Run segmentation model

### Reports & Dashboard

-   `GET /api/reports` -- Retrieve detection reports
-   `GET /api/stats` -- Dashboard statistics
-   `GET /api/fetch-image-base64` -- Retrieve stored images

### RAG Assistant

-   `POST /api/assistant_query` -- Ask natural-language questions

### System

-   `GET /health` -- Health check

## Key Features Explained

### 1. Dashboard (Command Center)

Displays: - Total soldiers detected - Total reports generated - Map of
detection locations - VLM-generated summaries\
Allows rapid situational awareness.

### 2. Analysis Page

Users upload images to: - Detect camouflaged soldiers - Identify
environment type - Count individuals - Detect weapons or equipment\
Used for intelligence validation and mission planning.

### 3. Assistant (RAG System)

Ask questions such as: - "How many detections happened today?" - "Show
detections in desert environments." - "Summarize last week's activity."\
Automatically retrieves relevant report data.

## PDF Report Generation

Reports include: - Timestamp & event ID\
- Coordinates\
- AI-generated contextual summary\
- Original & processed images\
- Soldier count and environment classification

## Configuration

### Backend `.env`

``` env
OPENAI_API_KEY=your_api_key
FIREBASE_CREDENTIALS_PATH=./backend/firebase.json
DEVICE_ID=Main-Detection-Unit
```

### Frontend `.env.local`

``` env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Usage Examples

### Upload Image

1.  Go to **Analysis**\
2.  Upload image\
3.  View detection results + AI summary\
4.  Download PDF

### Live Detection

``` bash
python segmentation.py
# or
python realtime_detection.py
```

### Ask the Assistant

-   "What was the earliest detection today?"
-   "What environment had the most activity?"
-   "Summarize all forest detections."

## Development Team

-   **Basim Aldawood**
-   **Nawaf Aljubair**
-   **Bader Aljobairy**
-   **Mohannad Alduwish**
-   **Abdulelah Alowaid**


**Status: Production Ready** \| **Version: 1.0** \| **Last Updated:
2025**

Built by Team **Camoubusters** at Tuwaiq Academy.
