"""
LLM Handler - Interface with OpenAI GPT-4 Vision API
Uses GPT-4 Vision for fast, accurate image analysis
"""

import base64
import io
from PIL import Image
import json
import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from project root
root_dir = Path(__file__).parent.parent
env_path = root_dir / '.env'
load_dotenv(dotenv_path=env_path)

# Import OpenAI
try:
    from openai import OpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False
    print("⚠️ OpenAI not installed. Install with: pip install openai")

class LLMReportGenerator:
    def __init__(self, api_key: str = None):
        """
        Initialize the LLM report generator with OpenAI GPT-4 Vision API
        
        Args:
            api_key: OpenAI API key (defaults to OPENAI_API_KEY env variable)
        """
        if not OPENAI_AVAILABLE:
            print("⚠️ Warning: OpenAI SDK not installed. Install with: pip install openai")
            self.api_key = None
            self.model_name = None
            self.client = None
            return
        
        # Use the provided API key
        self.api_key = api_key or os.getenv("OPENAI_API_KEY")
        
        if not self.api_key:
            raise ValueError("OPENAI_API_KEY environment variable is required. Please set it in your .env file.")
        else:
            print(f"✅ OpenAI API key loaded successfully")
        
        if self.api_key:
            self.client = OpenAI(api_key=self.api_key)
        else:
            self.client = None
        self.model_name = "gpt-4-turbo"
    
    async def generate_report(self, image: Image.Image) -> dict:
        """
        Generate AI analysis report for an image using OpenAI GPT-4 Vision
        
        Args:
            image: PIL Image object
        
        Returns:
            Dictionary containing AI analysis with keys:
            - summary: Brief description
            - environment: Environment type
            - soldier_count: Estimated count
            - attire: Description of clothing/camouflage
            - equipment: Visible equipment
        """
        if not self.api_key:
            print("⚠️ No API key available, using fallback analysis")
            return self._get_fallback_analysis()
        
        if not OPENAI_AVAILABLE:
            print("⚠️ OpenAI module not available, using fallback analysis")
            return self._get_fallback_analysis()
        
        print(f"✅ Starting AI analysis with OpenAI GPT-4 Vision")
        print(f"   API Key available: {bool(self.api_key)}")
        print(f"   Model: {self.model_name}")
        
        # Resize image to reasonable size (max 1024px)
        max_size = 1024
        img_copy = image.copy()
        if max(img_copy.size) > max_size:
            img_copy.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)
        
        # Construct the prompt
        prompt = self._create_analysis_prompt()
        
        # Convert image to base64
        buffered = io.BytesIO()
        img_copy.save(buffered, format="PNG")
        img_base64 = base64.b64encode(buffered.getvalue()).decode('utf-8')
        
        try:
            print(f"🤖 Requesting AI analysis from OpenAI ({self.model_name})...")
            
            # Create the OpenAI API call with vision
            response = self.client.chat.completions.create(
                model=self.model_name,
                messages=[
                    {
                        "role": "system",
                        "content": "You are a military intelligence analyst specializing in camouflage detection. Analyze images and respond ONLY with valid JSON."
                    },
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/png;base64,{img_base64}"
                                }
                            }
                        ]
                    }
                ],
                max_tokens=1000
            )
            
            print(f"📝 API Response received successfully")
            
            # Extract text from response
            analysis_text = response.choices[0].message.content
            
            print(f"   Raw response: {analysis_text[:200]}...")
            
            # Parse JSON from response
            try:
                # Clean the response text (remove markdown code blocks if present)
                cleaned_text = analysis_text.strip()
                if cleaned_text.startswith('```json'):
                    cleaned_text = cleaned_text[7:]
                if cleaned_text.startswith('```'):
                    cleaned_text = cleaned_text[3:]
                if cleaned_text.endswith('```'):
                    cleaned_text = cleaned_text[:-3]
                cleaned_text = cleaned_text.strip()
                
                analysis = json.loads(cleaned_text)
                print(f"✅ JSON parsed successfully")
            except json.JSONDecodeError as e:
                print(f"⚠️ JSON decode error: {str(e)}")
                # If response is not valid JSON, extract what we can
                analysis = self._parse_text_response(analysis_text)
            
            # Ensure all required fields are present
            analysis = self._validate_analysis(analysis)
            
            print("✅ AI analysis completed successfully")
            return analysis
            
        except Exception as e:
            print(f"❌ Error connecting to OpenAI API: {type(e).__name__}: {str(e)}")
            print(f"   Full error: {repr(e)}")
            
            # Return fallback analysis
            return self._get_fallback_analysis()
    
    def _create_analysis_prompt(self) -> str:
        """Create the structured prompt for OpenAI Vision API"""
        return """You are a military intelligence analyst specializing in camouflage detection. Analyze the provided image and return ONLY a valid JSON object with the following schema.

CRITICAL: Only count soldiers wearing camouflage (woodland, desert, digital, ghillie suits, etc.). DO NOT count soldiers in regular military uniforms without camouflage patterns.

Required JSON structure:
{
  "summary": "A brief 2-sentence summary of the environment and what was detected.",
  "environment": "Describe the environment (e.g., 'dense woodland', 'urban ruins', 'arid desert', 'mountainous terrain').",
  "camouflaged_soldier_count": 0,
  "has_camouflage": false,
  "attire_and_camouflage": "Describe the camouflage pattern and attire IF camouflaged soldiers are present. If no camouflage detected, write 'No camouflage detected'.",
  "equipment": "List any visible equipment IF camouflaged soldiers are present (e.g., 'rifles', 'backpacks'). If no camouflage detected, write 'N/A'."
}

IMPORTANT RULES:
1. Set "has_camouflage" to true ONLY if you detect soldiers with actual camouflage patterns
2. Set "camouflaged_soldier_count" to the number of soldiers wearing camouflage
3. Regular uniforms, tactical gear, or plain clothing DO NOT count as camouflage
4. If no camouflaged soldiers detected, set count to 0 and has_camouflage to false

Analyze the image and respond with ONLY the JSON object, no additional text."""
    
    def _parse_text_response(self, text: str) -> dict:
        """Attempt to extract structured data from non-JSON text response"""
        print("⚠️ Attempting to parse non-JSON response...")
        
        # Try to find JSON-like structure in the text
        import re
        
        # Look for JSON object
        json_match = re.search(r'\{[^{}]*\}', text, re.DOTALL)
        if json_match:
            try:
                return json.loads(json_match.group(0))
            except:
                pass
        
        # Fallback: Try to extract key information
        analysis = {
            "summary": "Unable to fully parse AI response",
            "environment": "Unknown",
            "camouflaged_soldier_count": 0,
            "has_camouflage": False,
            "attire_and_camouflage": "Unable to determine",
            "equipment": "Unable to determine"
        }
        
        # Try to find soldier count
        count_match = re.search(r'(\d+)\s+soldier', text, re.IGNORECASE)
        if count_match:
            analysis["camouflaged_soldier_count"] = int(count_match.group(1))
            analysis["has_camouflage"] = analysis["camouflaged_soldier_count"] > 0
        
        # Try to find environment
        env_match = re.search(r'environment[:\s]+([^\n.]+)', text, re.IGNORECASE)
        if env_match:
            analysis["environment"] = env_match.group(1).strip()
        
        return analysis
    
    def _validate_analysis(self, analysis: dict) -> dict:
        """Ensure all required fields are present in the analysis"""
        # Default structure
        default_analysis = {
            "summary": "Analysis completed",
            "environment": "Unknown",
            "camouflaged_soldier_count": 0,
            "has_camouflage": False,
            "attire_and_camouflage": "No camouflage detected",
            "equipment": "N/A"
        }
        
        # Merge with defaults
        for key, default_value in default_analysis.items():
            if key not in analysis or analysis[key] is None:
                analysis[key] = default_value
        
        # Ensure soldier_count is a number
        if not isinstance(analysis.get("camouflaged_soldier_count"), int):
            try:
                analysis["camouflaged_soldier_count"] = int(analysis.get("camouflaged_soldier_count", 0))
            except (ValueError, TypeError):
                analysis["camouflaged_soldier_count"] = 0
        
        # Ensure has_camouflage is a boolean
        if not isinstance(analysis.get("has_camouflage"), bool):
            analysis["has_camouflage"] = bool(analysis.get("camouflaged_soldier_count", 0) > 0)
        
        return analysis
    
    def _get_fallback_analysis(self) -> dict:
        """Return a default analysis when API is unavailable"""
        return {
            "summary": "AI analysis unavailable. Manual review recommended.",
            "environment": "Unable to determine",
            "camouflaged_soldier_count": 0,
            "has_camouflage": False,
            "attire_and_camouflage": "AI analysis unavailable",
            "equipment": "AI analysis unavailable"
        }
    
    def check_connection(self) -> bool:
        """Check if the OpenAI API is available and configured"""
        if not OPENAI_AVAILABLE:
            return False
        if not self.api_key:
            return False
        return True
