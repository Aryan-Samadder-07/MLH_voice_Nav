import logging
import httpx
from typing import Dict, Any, Optional
from app.core.config import settings
from app.core.languages import get_language_config, detect_language_heuristic

logger = logging.getLogger(__name__)

class ProblemSolverService:
    """
    Grounded AI Problem Solving & Q&A Service.
    Accurately guides users on existing features and explicitly identifies unbuilt/unsupported features.
    """

    def is_problem_query(self, query: str, lang: str = "en") -> bool:
        """
        Detects if user input is an informational/problem-solving question.
        """
        q = query.strip().lower()
        
        en_indicators = ["what is", "how do i", "how to", "why", "who", "where can i", "explain", "fix", "error", "problem", "tell me about", "can you help me with", "what does", "can i", "is there", "change my", "update my", "delete", "export", "download"]
        mr_indicators = ["काय", "कसे", "का", "कधी", "कुठे", "सांगा", "माहिती द्या", "मदत करा", "समस्या", "अडचण", "कसा करायचा", "कशी करावी", "बदलू शकतो का", "कसा बदलू", "kay", "kase", "kasa", "madat", "sang", "sanga"]
        bn_indicators = ["কী", "কি", "কীভাবে", "কেমন", "কেন", "কোথায়", "কখন", "বলুন", "তথ্য দিন", "সাহায্য করুন", "সমস্যা", "কিভাবে করব", "পরিবর্তন করতে পারি", "ki", "kivabe", "keno", "kothay", "sahajjo"]
        
        if any(w in q for w in en_indicators) or any(w in q for w in mr_indicators) or any(w in q for w in bn_indicators):
            return True
        if q.endswith("?") or q.endswith("？"):
            return True
            
        return False

    async def solve_or_explain(
        self,
        query: str,
        lang_code: str = "auto",
        preferred_lang: str = "en",
        page_lang: str = "en",
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Processes user questions using grounded AI reasoning with auto language detection.
        """
        resolved_lang = lang_code
        if lang_code == "auto" or not lang_code:
            resolved_lang = detect_language_heuristic(query, default_lang="en", preferred_lang=preferred_lang, page_lang=page_lang)

        lang_cfg = get_language_config(resolved_lang)

        system_prompt = f"""You are the Voice AI Assistant for VoiceNav AI.
Language: {lang_code} (English, Bengali / বাংলা, or Marathi / मराठी).

CRITICAL KNOWLEDGE BASE & GROUNDING:
1. Existing Available Features in this web application:
   - Dashboard (/): View system overview and quick voice command recommendations.
   - Analytics (/analytics): View real-time accuracy charts, latency stats, and usage distribution.
   - Profile (/profile): View user name (Aryan Samadder), role, and recent voice activities.
   - Settings (/settings): Configure primary STT/TTS engine, match threshold, and API status.
   - Diagnostics (/diagnostics): Live rate limit monitors, RPM counter, and model latency health.
   - Help (/help): Multilingual voice commands cheatsheet and reference guide.
2. Unimplemented / Future Features:
   - Editing profile info, changing phone numbers/passwords, exporting CSV data, payment gateway, dark mode toggle, and external ML vision pipelines are CURRENTLY UNDER DEVELOPMENT / NOT YET IMPLEMENTED.
3. Guidelines:
   - If the user asks about an unimplemented feature (e.g. changing phone number, editing profile, exporting data), politely and clearly state that this feature is currently not supported or under development in the requested language ({resolved_lang}), and recommend what they can do instead.
   - Plain conversational text ONLY. DO NOT use markdown symbols, NO asterisks (**), NO arrows (>), NO bullet hashes (#). Speakable text only.
   - Maximum 2 sentences.
"""

        # Call live Groq AI
        if settings.GROQ_API_KEY:
            try:
                async with httpx.AsyncClient(timeout=8.0) as client:
                    resp = await client.post(
                        "https://api.groq.com/openai/v1/chat/completions",
                        headers={
                            "Authorization": f"Bearer {settings.GROQ_API_KEY}",
                            "Content-Type": "application/json"
                        },
                        json={
                            "model": settings.GROQ_LLM_MODEL,
                            "messages": [
                                {"role": "system", "content": system_prompt},
                                {"role": "user", "content": query}
                            ],
                            "temperature": 0.1,
                            "max_tokens": 140
                        }
                    )
                    if resp.status_code == 200:
                        content = resp.json()["choices"][0]["message"]["content"].strip()
                        # Clean any stray markdown
                        clean_content = content.replace("**", "").replace("*", "").replace(">", "").replace("#", "").strip()
                        return {
                            "intent": "PROBLEM_SOLVING",
                            "action": "NONE",
                            "query": query,
                            "language": lang_cfg.code,
                            "response_text": clean_content,
                            "target_path": "/help",
                            "confidence": 0.98,
                            "engine": "live_groq_ai"
                        }
            except Exception as e:
                logger.error(f"Live AI Problem Solver Error: {e}")

        # Grounded fallback
        if resolved_lang == "bn":
            fallback_msg = f"আপনার '{query}' প্রশ্নের জন্য: এই সুবিধাটি বর্তমানে নির্মাণাধীন রয়েছে। আপনি ড্যাশবোর্ড, অ্যানালিটিক্স, প্রোফাইল বা সেটিংস দেখতে পারেন।"
        elif resolved_lang == "mr":
            fallback_msg = f"तुमच्या '{query}' या प्रश्नासाठी: हे वैशिष्ट्य सध्या विकसित केले जात आहे. तुम्ही डॅशबोर्ड, ॲनालिटिक्स, प्रोफाईल आणि सेटिंग्ज पाहू शकता."
        else:
            fallback_msg = f"Regarding '{query}': That feature is currently not available or under development. You can explore Dashboard, Analytics, Profile, Settings, and Diagnostics."

        return {
            "intent": "PROBLEM_SOLVING",
            "action": "NONE",
            "query": query,
            "language": lang_cfg.code,
            "response_text": fallback_msg,
            "target_path": "/help",
            "confidence": 0.90,
            "engine": "grounded_guidance"
        }

problem_solver = ProblemSolverService()
