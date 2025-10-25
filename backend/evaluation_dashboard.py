"""
RAG Evaluation Dashboard
Simple web interface to view evaluation results and PromptLayer metrics
"""

import json
import os
from datetime import datetime
from typing import Dict, List
import asyncio
from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
import uvicorn

app = FastAPI(title="RAG Evaluation Dashboard")

# Create templates directory if it doesn't exist
os.makedirs("templates", exist_ok=True)

templates = Jinja2Templates(directory="templates")

@app.get("/", response_class=HTMLResponse)
async def dashboard(request: Request):
    """Main evaluation dashboard"""
    
    # Look for latest evaluation results
    evaluation_files = [f for f in os.listdir(".") if f.startswith("rag_evaluation_") and f.endswith(".json")]
    
    if not evaluation_files:
        return HTMLResponse("""
        <!DOCTYPE html>
        <html>
        <head>
            <title>RAG Evaluation Dashboard</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
                .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                .header { text-align: center; color: #333; margin-bottom: 30px; }
                .no-data { text-align: center; color: #666; padding: 40px; }
                .run-eval { text-align: center; margin-top: 30px; }
                .btn { background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1 class="header">🔬 RAG Evaluation Dashboard</h1>
                <div class="no-data">
                    <h3>No evaluation results found</h3>
                    <p>Run the evaluation script to see metrics and results.</p>
                    <div class="run-eval">
                        <a href="/run-evaluation" class="btn">Run Evaluation</a>
                    </div>
                </div>
            </div>
        </body>
        </html>
        """)
    
    # Load latest results
    latest_file = max(evaluation_files, key=lambda x: os.path.getctime(x))
    
    with open(latest_file, 'r') as f:
        data = json.load(f)
    
    results = data.get("detailed_results", [])
    metadata = data.get("evaluation_metadata", {})
    
    # Calculate summary metrics
    total_queries = len(results)
    successful_queries = sum(1 for r in results if r.get("success"))
    success_rate = (successful_queries / total_queries * 100) if total_queries > 0 else 0
    
    avg_response_time = sum(r.get("response_time", 0) for r in results if "response_time" in r) / len([r for r in results if "response_time" in r]) if results else 0
    avg_quality = sum(r.get("quality_score", 0) for r in results if "quality_score" in r) / len([r for r in results if "quality_score" in r]) if results else 0
    
    # Group by category
    categories = {}
    for result in results:
        category = result.get("category", "unknown")
        if category not in categories:
            categories[category] = []
        categories[category].append(result)
    
    return templates.TemplateResponse("dashboard.html", {
        "request": request,
        "metadata": metadata,
        "total_queries": total_queries,
        "successful_queries": successful_queries,
        "success_rate": success_rate,
        "avg_response_time": avg_response_time,
        "avg_quality": avg_quality,
        "categories": categories,
        "results": results
    })

@app.get("/run-evaluation")
async def run_evaluation():
    """Run RAG evaluation and redirect to results"""
    import subprocess
    import sys
    
    try:
        # Run evaluation script
        result = subprocess.run([sys.executable, "rag_evaluation.py"], 
                              capture_output=True, text=True, cwd=".")
        
        if result.returncode == 0:
            return HTMLResponse("""
            <!DOCTYPE html>
            <html>
            <head>
                <title>Evaluation Complete</title>
                <meta http-equiv="refresh" content="3;url=/">
                <style>
                    body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
                    .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; text-align: center; }
                    .success { color: #28a745; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1 class="success">✅ Evaluation Complete!</h1>
                    <p>Redirecting to dashboard...</p>
                </div>
            </body>
            </html>
            """)
        else:
            return HTMLResponse(f"""
            <!DOCTYPE html>
            <html>
            <head>
                <title>Evaluation Error</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
                    .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; }
                    .error { color: #dc3545; }
                    pre { background: #f8f9fa; padding: 15px; border-radius: 5px; overflow-x: auto; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1 class="error">❌ Evaluation Failed</h1>
                    <pre>{result.stderr}</pre>
                    <p><a href="/">← Back to Dashboard</a></p>
                </div>
            </body>
            </html>
            """)
    except Exception as e:
        return HTMLResponse(f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Evaluation Error</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
                .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; }
                .error { color: #dc3545; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1 class="error">❌ Evaluation Error</h1>
                <p>{str(e)}</p>
                <p><a href="/">← Back to Dashboard</a></p>
            </div>
        </body>
        </html>
        """)

@app.get("/promptlayer")
async def promptlayer_redirect():
    """Redirect to PromptLayer dashboard"""
    return HTMLResponse("""
    <!DOCTYPE html>
    <html>
    <head>
        <title>Redirecting to PromptLayer</title>
        <meta http-equiv="refresh" content="0;url=https://promptlayer.com/dashboard">
    </head>
    <body>
        <p>Redirecting to PromptLayer dashboard...</p>
    </body>
    </html>
    """)

if __name__ == "__main__":
    print("🚀 Starting RAG Evaluation Dashboard...")
    print("📊 Dashboard: http://localhost:8001")
    print("🔗 PromptLayer: https://promptlayer.com/dashboard")
    uvicorn.run(app, host="0.0.0.0", port=8001)
