"""
LLM Handler - Interface with Google Gemini 2.5 Flash (FREE Vision API)
Uses Gemini for fast, accurate image analysis with no cost
"""

import requests
import base64
import io
from PIL import Image
import json
import os

class LLMReportGenerator:
    def __init__(self, api_key: str = None):
        """
        Initialize the LLM report generator with Google Gemini API
        
        Args:
            api_key: Google AI Studio API key (defaults to GEMINI_API_KEY env variable)
        """
        self.api_key = api_key or os.getenv("GEMINI_API_KEY")
        if not self.api_key:
            print("⚠️ Warning: No Gemini API key found. Set GEMINI_API_KEY environment variable.")
        self.model_name = "gemini-2.5-flash"  # Fast and FREE vision model (latest version)
        self.api_endpoint = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model_name}:generateContent"
    
    async def generate_report(self, image: Image.Image) -> dict:
        """
        Generate AI analysis report for an image using Gemini 1.5 Flash
        
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
        
        # Convert image to base64
        buffered = io.BytesIO()
        # Resize image to reasonable size (max 1024px)
        max_size = 1024
        if max(image.size) > max_size:
            image.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)
        image.save(buffered, format="JPEG", quality=85)
        img_base64 = base64.b64encode(buffered.getvalue()).decode('utf-8')
        
        # Construct the prompt
        prompt = self._create_analysis_prompt()
        
        # Prepare request payload for Gemini API
        payload = {
            "contents": [
                {
                    "parts": [
                        {
                            "text": f"You are a military intelligence analyst. Analyze this image and respond ONLY with valid JSON in this exact format:\n\n{prompt}"
                        },
                        {
                            "inline_data": {
                                "mime_type": "image/jpeg",
                                "data": img_base64
                            }
                        }
                    ]
                }
            ],
            "generationConfig": {
                "temperature": 0.3,
                "maxOutputTokens": 2048
            }
        }
        
        try:
            # Make request to Gemini API
            print(f"🤖 Requesting AI analysis from Gemini ({self.model_name})...")
            response = requests.post(
                f"{self.api_endpoint}?key={self.api_key}",
                json=payload,
                timeout=30
            )
            response.raise_for_status()
            
            # Parse response
            result = response.json()
            
            # Debug: print the response structure
            print(f"📝 API Response received")
            
            # Extract text from response
            try:
                candidates = result.get("candidates", [])
                if candidates and len(candidates) > 0:
                    content = candidates[0].get("content", {})
                    parts = content.get("parts", [])
                    if parts and len(parts) > 0:
                        analysis_text = parts[0].get("text", "")
                    else:
                        raise ValueError("No parts in response")
                else:
                    raise ValueError("No candidates in response")
            except (KeyError, IndexError, ValueError) as e:
                print(f"⚠️ Error parsing response structure: {str(e)}")
                print(f"   Response: {json.dumps(result)[:500]}")
                return self._get_fallback_analysis()
            
            # Parse JSON from response
            try:
                analysis = json.loads(analysis_text)
            except json.JSONDecodeError:
                # If response is not valid JSON, extract what we can
                analysis = self._parse_text_response(analysis_text)
            
            # Ensure all required fields are present
            analysis = self._validate_analysis(analysis)
            
            print("✅ AI analysis completed")
            return analysis
            
        except requests.exceptions.RequestException as e:
            print(f"⚠️ Error connecting to Gemini API: {str(e)}")
            if hasattr(e, 'response') and e.response is not None:
                try:
                    error_detail = e.response.json()
                    print(f"   API Error: {error_detail.get('error', {}).get('message', 'Unknown error')}")
                except:
                    print(f"   Response: {e.response.text[:200]}")
            # Return fallback analysis
            return self._get_fallback_analysis()
        except Exception as e:
            print(f"⚠️ Error generating report: {str(e)}")
            return self._get_fallback_analysis()
    
    def _create_analysis_prompt(self) -> str:
        """Create the structured prompt for Gemini Vision"""
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
        """
        Parse non-JSON text response and extract information
        
        Args:
            text: Raw text response from LLM
        
        Returns:
            Structured dictionary
        """
        # Try to extract JSON from text
        import re
        json_match = re.search(r'\{.*\}', text, re.DOTALL)
        if json_match:
            try:
                return json.loads(json_match.group())
            except:
                pass
        
        # Fallback: basic text parsing
        return {
            "summary": text[:200] if text else "Analysis generated from detected image.",
            "environment": "Unknown environment",
            "camouflaged_soldier_count": 0,
            "has_camouflage": False,
            "attire_and_camouflage": "No camouflage detected",
            "equipment": "N/A"
        }
    
    def _validate_analysis(self, analysis: dict) -> dict:
        """
        Ensure analysis has all required fields
        
        Args:
            analysis: Analysis dictionary
        
        Returns:
            Validated dictionary with all required fields
        """
        required_fields = {
            "summary": "Image analyzed for camouflaged soldiers.",
            "environment": "Unknown environment",
            "camouflaged_soldier_count": 0,
            "has_camouflage": False,
            "attire_and_camouflage": "No camouflage detected",
            "equipment": "N/A"
        }
        
        # Map old field names to new ones for backward compatibility
        if "soldier_count" in analysis and "camouflaged_soldier_count" not in analysis:
            analysis["camouflaged_soldier_count"] = analysis.get("soldier_count", 0)
        
        if "attire" in analysis and "attire_and_camouflage" not in analysis:
            analysis["attire_and_camouflage"] = analysis.get("attire", "Unknown")
        
        # Determine has_camouflage if not set
        if "has_camouflage" not in analysis:
            count = analysis.get("camouflaged_soldier_count", 0)
            analysis["has_camouflage"] = count > 0
        
        # Fill in missing fields with defaults
        for field, default_value in required_fields.items():
            if field not in analysis or not analysis[field]:
                analysis[field] = default_value
        
        return analysis
    
    def _get_fallback_analysis(self) -> dict:
        """
        Return a fallback analysis when LLM is unavailable
        
        Returns:
            Default analysis dictionary
        """
        return {
            "summary": "Image analyzed. Detailed analysis requires LLM connection.",
            "environment": "Unknown environment (LLM unavailable)",
            "camouflaged_soldier_count": 0,
            "has_camouflage": False,
            "attire_and_camouflage": "Unable to analyze - LLM connection required",
            "equipment": "Unable to analyze - LLM connection required"
        }
    
    def check_connection(self) -> bool:
        """
        Check if Gemini API key is available and valid
        
        Returns:
            True if API key is configured, False otherwise
        """
        if not self.api_key:
            print("⚠️ No Gemini API key configured")
            print("   Set GEMINI_API_KEY environment variable")
            return False
        
        try:
            # Quick API check with minimal request
            response = requests.get(
                f"https://generativelanguage.googleapis.com/v1beta/models/{self.model_name}?key={self.api_key}",
                timeout=5
            )
            
            if response.status_code == 200:
                print(f"✅ Gemini API connected ({self.model_name})")
                return True
            else:
                print(f"⚠️ Gemini API error: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"⚠️ Cannot connect to Gemini API: {str(e)}")
            return False
