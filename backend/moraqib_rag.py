"""
Moraqib RAG Handler - Query detection reports using natural language
RAG (Retrieval-Augmented Generation) system with strict guardrails
"""

import os
import re
import requests
import json
import base64
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from dotenv import load_dotenv
from firestore_handler import firestore_handler

# Load environment variables
load_dotenv()

# Import PromptLayer (optional - only if API key is set)
try:
    import promptlayer
    PROMPTLAYER_AVAILABLE = True
except ImportError:
    PROMPTLAYER_AVAILABLE = False
    print("⚠️  PromptLayer not installed. Install with: pip install promptlayer")

class MoraqibRAG:
    def __init__(self, api_key: str = None):
        """
        Initialize Moraqib RAG assistant
        
        Args:
            api_key: Google Gemini API key
        """
        self.api_key = api_key or os.getenv("GEMINI_API_KEY")
        if not self.api_key:
            raise ValueError("Gemini API key required for Moraqib")
        
        self.model_name = "gemini-2.5-flash"
        self.api_endpoint = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model_name}:generateContent"
        
        # Initialize PromptLayer if available
        self.promptlayer_api_key = os.getenv("PROMPTLAYER_API_KEY")
        self.use_promptlayer = PROMPTLAYER_AVAILABLE and self.promptlayer_api_key
        
        if self.use_promptlayer:
            promptlayer.api_key = self.promptlayer_api_key
            print("✅ PromptLayer integration enabled")
        else:
            print("⚠️  PromptLayer integration disabled (no API key or not installed)")
        
        # System instruction for strict guardrails
        self.system_instruction = """You are 'Moraqib,' a specialized AI assistant for the 'Mirqab' camouflaged soldier detection system. Your one and only function is to answer questions based exclusively on the detection reports provided in the 'Context'.

Your Rules:

1. ANALYZE the provided 'Context' (which contains detection reports) to answer the user's 'Query'. Each report contains: timestamp, location, soldier count, environment description, attire/camouflage details, and equipment information.

2. If the answer is in the Context, provide it clearly and concisely. You may summarize, count, or filter information from multiple reports based on the query.

3. When users ask about specific topics (e.g., "woodland areas", "camouflage uniforms", "equipment"), search through ALL provided reports and extract relevant information even if the exact keywords don't match. Use semantic understanding:
   - "woodland" relates to: forest, trees, vegetation, wooded areas
   - "camouflage" relates to: uniform patterns, attire, clothing, gear
   - "equipment" relates to: weapons, rifles, tactical gear, backpacks, helmets, vests

4. If the Context contains reports but they don't match the specific query criteria (e.g., asking about "desert" when only "woodland" reports exist), clearly state: "Based on the available reports, I found X detections, but none match the specific criteria of [user's request]. The available reports show: [brief summary]."

5. If the Context is completely empty or contains no relevant information, respond with: "I'm sorry, I can only provide information found in the Mirqab detection reports."

6. You are forbidden from answering any general knowledge questions, engaging in chit-chat, or discussing any topic outside of the provided detection reports.

7. When summarizing reports, always cite the report ID (e.g., "According to report MIR-20251024-0001...").

8. If asked about counts, count the reports accurately and show your work (e.g., "Found 3 reports: MIR-001, MIR-002, MIR-003").

9. If asked about time periods (e.g., "last night", "yesterday"), only use reports that fall within that time range based on their timestamps.

10. Be helpful and informative - extract maximum value from the provided reports to answer the user's question."""
    
    def retrieve_relevant_reports(self, query: str, limit: int = 50) -> List[Dict]:
        """
        Retrieve relevant reports based on user query
        
        Args:
            query: Natural language query
            limit: Maximum number of reports to retrieve
        
        Returns:
            list: Relevant detection reports
        """
        try:
            # Extract keywords and time filters from query
            time_filter = self._extract_time_filter(query)
            device_filter = self._extract_device_filter(query)
            
            print(f"🔍 Retrieving reports with filters:")
            print(f"   Time: {time_filter}")
            print(f"   Device: {device_filter}")
            
            # Query Firestore
            if time_filter:
                print(f"   Using time-filtered query...")
                reports = firestore_handler.query_reports(
                    start_date=time_filter.get('start'),
                    end_date=time_filter.get('end'),
                    device_id=device_filter,
                    limit=limit
                )
            else:
                # No time filter - check if it's a general query or specific search
                query_lower = query.lower()
                
                # General queries that should return all/recent reports
                general_keywords = [
                    'all', 'total', 'count', 'how many', 'last report', 'latest', 
                    'recent', 'show me', 'list', 'summary', 'overview', 'any detections',
                    'what detections', 'show all', 'give me all'
                ]
                is_general_query = any(keyword in query_lower for keyword in general_keywords)
                
                # Also treat very short queries as general
                if len(query.split()) <= 3 and not is_general_query:
                    is_general_query = True
                
                if is_general_query:
                    print(f"   Detected general query, getting recent reports...")
                    reports = firestore_handler.query_reports(limit=limit)
                else:
                    # Specific search - try keyword search
                    keywords = self._extract_keywords(query)
                    print(f"   Keywords extracted: '{keywords}'")
                    
                    if keywords and len(keywords.strip()) > 2:
                        print(f"   Using keyword search...")
                        reports = firestore_handler.search_reports(keywords, limit=limit)
                        
                        # If keyword search returns no results, fallback to all reports
                        if not reports:
                            print(f"   No results from keyword search, getting all reports...")
                            reports = firestore_handler.query_reports(limit=limit)
                    else:
                        # Fallback to recent reports
                        print(f"   Getting recent reports (no specific keywords)...")
                        reports = firestore_handler.query_reports(limit=limit)
            
            print(f"✅ Retrieved {len(reports)} relevant reports")
            return reports
            
        except Exception as e:
            print(f"❌ Error retrieving reports: {e}")
            return []
    
    def _extract_time_filter(self, query: str) -> Optional[Dict]:
        """Extract time range from query"""
        query_lower = query.lower()
        now = datetime.now()
        
        # Only extract time if explicitly mentioned with specific keywords
        # Be strict to avoid false positives
        
        # Last hour
        if 'last hour' in query_lower or 'past hour' in query_lower or 'within the hour' in query_lower:
            return {
                'start': now - timedelta(hours=1),
                'end': now
            }
        
        # Last 24 hours / today (but NOT if "yesterday" is also mentioned)
        if ('last 24 hours' in query_lower or 
            ('today' in query_lower and 'yesterday' not in query_lower) or 
            'last day' in query_lower or
            'past 24 hours' in query_lower):
            return {
                'start': now - timedelta(days=1),
                'end': now
            }
        
        # Yesterday - ONLY if explicitly asking about yesterday
        if 'yesterday' in query_lower and ('how many' in query_lower or 'what' in query_lower or 'show' in query_lower or 'were' in query_lower):
            yesterday_start = now.replace(hour=0, minute=0, second=0) - timedelta(days=1)
            yesterday_end = yesterday_start + timedelta(days=1)
            return {
                'start': yesterday_start,
                'end': yesterday_end
            }
        
        # Last week
        if 'last week' in query_lower or 'past week' in query_lower or 'this week' in query_lower:
            return {
                'start': now - timedelta(weeks=1),
                'end': now
            }
        
        # Last night (6 PM yesterday to 6 AM today)
        if 'last night' in query_lower or 'tonight' in query_lower:
            # 6 PM yesterday
            night_start = now.replace(hour=18, minute=0, second=0) - timedelta(days=1)
            # 6 AM today
            night_end = now.replace(hour=6, minute=0, second=0)
            return {
                'start': night_start,
                'end': night_end
            }
        
        # If none of the above, return None (no time filter)
        return None
    
    def _extract_device_filter(self, query: str) -> Optional[str]:
        """Extract device ID from query"""
        # Look for patterns like "Pi-001" or "device 001"
        match = re.search(r'(Pi-\d{3}|device\s+\d{3})', query, re.IGNORECASE)
        if match:
            return match.group(1)
        return None
    
    def _extract_keywords(self, query: str) -> str:
        """
        Extract meaningful keywords from query with domain-specific intelligence
        
        Args:
            query: User's natural language query
        
        Returns:
            str: Extracted keywords for search
        """
        query_lower = query.lower()
        
        # Domain-specific keyword mapping
        keyword_mappings = {
            # Environment terms
            'woodland': 'woodland',
            'forest': 'woodland',
            'desert': 'desert',
            'urban': 'urban',
            'mountain': 'mountain',
            'jungle': 'jungle',
            'field': 'field',
            'terrain': 'terrain',
            
            # Camouflage patterns
            'camouflage': 'camouflage',
            'camo': 'camouflage',
            'uniform': 'camouflage',
            'pattern': 'pattern',
            'digital': 'digital',
            'multicam': 'multicam',
            'ghillie': 'ghillie',
            
            # Equipment terms
            'equipment': 'equipment',
            'weapon': 'weapon rifle',
            'rifle': 'rifle',
            'gear': 'gear',
            'backpack': 'backpack',
            'tactical': 'tactical',
            'helmet': 'helmet',
            'vest': 'vest',
        }
        
        # Extract mapped keywords
        extracted_keywords = []
        for term, mapped_value in keyword_mappings.items():
            if term in query_lower:
                extracted_keywords.append(mapped_value)
        
        # If we found domain-specific terms, return them
        if extracted_keywords:
            return ' '.join(extracted_keywords)
        
        # Otherwise, use basic stopword removal
        stopwords = {
            'what', 'when', 'where', 'who', 'how', 'many', 'is', 'are', 'was', 'were', 
            'the', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
            'tell', 'me', 'about', 'show', 'give', 'find', 'get', 'any', 'all',
            'detected', 'detection', 'report', 'reports'
        }
        words = query_lower.split()
        keywords = ' '.join([w for w in words if w not in stopwords and len(w) > 2])
        return keywords
    
    def augment_context(self, reports: List[Dict]) -> str:
        """
        Create context block from retrieved reports
        
        Args:
            reports: List of detection reports
        
        Returns:
            str: Formatted context for LLM
        """
        if not reports:
            return "No detection reports found."
        
        context_parts = []
        context_parts.append(f"Detection Reports (Total: {len(reports)}):\n")
        
        for i, report in enumerate(reports, 1):
            location = report.get('location', {})
            lon = location.get('longitude', 0.0) if isinstance(location, dict) else 0.0
            lat = location.get('latitude', 0.0) if isinstance(location, dict) else 0.0
            
            report_text = f"""
Report #{i}:
- Report ID: {report.get('report_id', 'N/A')}
- Timestamp: {report.get('timestamp', 'N/A')}
- Device: {report.get('source_device_id', 'N/A')}
- Location: Latitude {lat:.6f}, Longitude {lon:.6f}
- Soldier Count: {report.get('soldier_count', 0)}
- Environment: {report.get('environment', 'Unknown')}
- Attire & Camouflage: {report.get('attire_and_camouflage', 'Unknown')}
- Equipment: {report.get('equipment', 'Unknown')}
"""
            context_parts.append(report_text)
        
        return '\n'.join(context_parts)
    
    async def generate_answer(self, query: str, context: str) -> str:
        """
        Generate answer using Gemini with strict guardrails
        
        Args:
            query: User's question
            context: Retrieved detection reports context
        
        Returns:
            str: AI-generated answer
        """
        try:
            # Construct prompt with system instruction, context, and query
            full_prompt = f"""{self.system_instruction}

Context (Detection Reports):
{context}

User Query: {query}

Answer:"""
            
            # Prepare request
            payload = {
                "contents": [
                    {
                        "parts": [
                            {
                                "text": full_prompt
                            }
                        ]
                    }
                ],
                "generationConfig": {
                    "temperature": 0.2,  # Low temperature for consistent, factual responses
                    "maxOutputTokens": 1024,
                    "topP": 0.95,
                    "topK": 40
                }
            }
            
            # Send request
            url = f"{self.api_endpoint}?key={self.api_key}"
            
            # Track start time for latency
            start_time = datetime.now()
            
            response = requests.post(url, json=payload, timeout=30)
            
            # Calculate latency
            latency_ms = (datetime.now() - start_time).total_seconds() * 1000
            
            if response.status_code == 200:
                result = response.json()
                
                # Extract answer
                answer = "I'm sorry, I couldn't generate a response."
                if 'candidates' in result and len(result['candidates']) > 0:
                    candidate = result['candidates'][0]
                    if 'content' in candidate and 'parts' in candidate['content']:
                        answer = candidate['content']['parts'][0]['text'].strip()
                
                # Log to PromptLayer if enabled
                if self.use_promptlayer:
                    try:
                        promptlayer.track.prompt(
                            function_name="moraqib_rag_query",
                            provider="google",
                            input_variables={
                                "query": query,
                                "context_length": len(context),
                                "reports_count": context.count("Report #")
                            },
                            prompt_template=self.system_instruction,
                            model=self.model_name,
                            temperature=0.2,
                            max_tokens=1024,
                            prompt=full_prompt,
                            response=answer,
                            latency_ms=latency_ms,
                            metadata={
                                "system": "Mirqab",
                                "component": "Moraqib RAG",
                                "timestamp": datetime.now().isoformat()
                            }
                        )
                        print(f"📊 Logged to PromptLayer (latency: {latency_ms:.2f}ms)")
                    except Exception as pl_error:
                        print(f"⚠️  PromptLayer logging failed: {pl_error}")
                
                return answer
            else:
                print(f"❌ Gemini API error: {response.status_code}")
                print(f"   Response: {response.text}")
                return "I'm sorry, I encountered an error processing your question."
        
        except Exception as e:
            print(f"❌ Error generating answer: {e}")
            return "I'm sorry, I encountered an error processing your question."
    
    async def query(self, user_question: str) -> Dict:
        """
        Process user query through RAG pipeline
        
        Args:
            user_question: Natural language question from user
        
        Returns:
            dict: Response with answer and metadata
        """
        try:
            print(f"\n💬 Moraqib Query: {user_question}")
            
            # Step 1: Retrieve relevant reports
            print("📚 Step 1: Retrieving relevant reports...")
            reports = self.retrieve_relevant_reports(user_question, limit=50)
            
            # Step 2: Augment context
            print("📝 Step 2: Creating context from reports...")
            context = self.augment_context(reports)
            
            # Step 3: Generate answer
            print("🤖 Step 3: Generating answer with Gemini...")
            answer = await self.generate_answer(user_question, context)
            
            print(f"✅ Answer generated ({len(answer)} chars)")
            
            return {
                "success": True,
                "question": user_question,
                "answer": answer,
                "reports_count": len(reports),
                "reports_used": [r.get('report_id', 'N/A') for r in reports[:10]]  # First 10 IDs
            }
            
        except Exception as e:
            print(f"❌ Error in Moraqib query: {e}")
            import traceback
            traceback.print_exc()
            
            return {
                "success": False,
                "question": user_question,
                "answer": "I'm sorry, I encountered an error processing your question.",
                "error": str(e)
            }


# Global instance
moraqib_rag = MoraqibRAG()
