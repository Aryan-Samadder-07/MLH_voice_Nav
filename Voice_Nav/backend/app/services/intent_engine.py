import json
import os
import random
import logging
import time
import httpx
from typing import Dict, Any, List, Optional
from rapidfuzz import fuzz
from app.core.config import settings
from app.core.languages import get_language_config, SUPPORTED_LANGUAGES, detect_language_heuristic
from app.services.problem_solver import problem_solver
from app.services.rate_limiter import rate_tracker

logger = logging.getLogger(__name__)

INTENTS_FILE_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "training_intents.json")

class NavigationIntentEngine:
    """
    Real-world Multilingual Intent & Navigation Engine.
    Handles noisy STT acoustic misrecognitions, phonetic transliterations, and live Groq AI reasoning.
    """

    def __init__(self):
        self.routes_data: List[Dict[str, Any]] = []
        self.load_training_data()

    def load_training_data(self) -> None:
        """Loads the registered routes catalog."""
        try:
            if os.path.exists(INTENTS_FILE_PATH):
                with open(INTENTS_FILE_PATH, "r", encoding="utf-8") as f:
                    self.routes_data = json.load(f)
            else:
                self.routes_data = []
        except Exception as e:
            logger.error(f"Failed to load routes catalog: {e}")
            self.routes_data = []

    def save_training_data(self) -> bool:
        """Persists trained phrases to JSON catalog."""
        try:
            with open(INTENTS_FILE_PATH, "w", encoding="utf-8") as f:
                json.dump(self.routes_data, f, ensure_ascii=False, indent=2)
            return True
        except Exception as e:
            logger.error(f"Failed to persist training catalog: {e}")
            return False

    def get_all_routes(self) -> List[Dict[str, Any]]:
        """Returns all registered application routes."""
        return self.routes_data

    def train_utterance(self, route_id: str, utterance: str, lang_code: str = "en") -> Dict[str, Any]:
        """
        Dynamically registers custom voice command in real time.
        """
        lang = lang_code.lower().split("-")[0]
        target_field = f"utterances_{lang}"
        
        route = next((r for r in self.routes_data if r["route_id"] == route_id), None)
        if not route:
            return {"success": False, "message": f"Route '{route_id}' not found."}

        if target_field not in route:
            route[target_field] = []

        cleaned = utterance.strip()
        if not cleaned:
            return {"success": False, "message": "Utterance cannot be empty."}

        if cleaned not in route[target_field]:
            route[target_field].append(cleaned)
            self.save_training_data()
            return {
                "success": True,
                "message": f"Successfully trained '{cleaned}' for route '{route_id}' ({lang}).",
                "route_id": route_id,
                "total_utterances": len(route[target_field])
            }
        
        return {
            "success": True,
            "message": f"Utterance '{cleaned}' already registered for route '{route_id}'.",
            "route_id": route_id
        }

    def find_fuzzy_phonetic_match(self, query: str, lang_code: str = "en") -> Optional[Dict[str, Any]]:
        """
        Phonetic & fuzzy acoustic matcher that recovers words misheard due to microphone noise or accent.
        E.g. "there's wood" -> Dashboard, "analytix" / "analysis" -> Analytics, "pro file" -> Profile.
        """
        q = query.lower().strip()
        best_match = None
        best_score = 0.0

        for route in self.routes_data:
            route_id = route["route_id"]
            keywords = route.get("keywords_en", []) + route.get("keywords_mr", []) + route.get("keywords_bn", [])
            utterances = route.get("utterances_en", []) + route.get("utterances_mr", []) + route.get("utterances_bn", [])
            all_candidates = keywords + utterances + [
                route.get("name_en", "").lower(),
                route.get("name_mr", "").lower(),
                route.get("name_bn", "").lower()
            ]

            for cand in all_candidates:
                if not cand:
                    continue
                cand_lower = cand.lower()
                # 1. Exact or substring match
                if q == cand_lower or cand_lower in q:
                    return {"route": route, "score": 98.0, "matched_candidate": cand}

                # 2. Token Sort / Token Set Ratio
                score_sort = fuzz.token_sort_ratio(q, cand_lower)
                score_set = fuzz.token_set_ratio(q, cand_lower)
                score_partial = fuzz.partial_ratio(q, cand_lower)
                max_cand_score = max(score_sort, score_set, score_partial)

                if max_cand_score > best_score:
                    best_score = max_cand_score
                    best_match = {"route": route, "score": max_cand_score, "matched_candidate": cand}

        if best_match and best_score >= 70.0:
            return best_match

        return None

    async def _classify_with_groq_ai(
        self,
        query: str,
        lang_code: str = "auto",
        preferred_lang: str = "en",
        page_lang: str = "en",
        form_context: Optional[Dict[str, Any]] = None,
        current_path: Optional[str] = None,
        conversation_history: Optional[List[Dict[str, Any]]] = None
    ) -> Optional[Dict[str, Any]]:
        """
        AI intent & slot extraction through live Groq inference with auto-language detection,
        multi-turn conversational form filling, and conversation history context tracking.
        """
        routes_compact = [
            {"id": r["route_id"], "path": r["path"], "name": f"{r['name_en']} / {r.get('name_mr', '')} / {r.get('name_bn', '')}"}
            for r in self.routes_data
        ]

        system_prompt = f"""You are an Intelligent Multilingual Assistant for Step-by-Step Form-Filling and Navigation.
Language Context: Mode: {lang_code}, Page Language: {page_lang}, Current Route: {current_path or "/"}, Form Context: {json.dumps(form_context or {}, ensure_ascii=False)}
Routes: {json.dumps(routes_compact, ensure_ascii=False)}

Strict Conversational & Reasoning Protocols:
1. Fine-Grained Character & Spelling Corrections (CRITICAL):
   - When the user asks to change, replace, or correct characters/spelling in a field:
     * e.g., "change 'a' to 'o'", "ইংরেজিতে এ বদলে ও হবে" (in English change 'a' to 'o'), "make it Romesh", "spelling is Suresh", "গ্রামের নাম হবে শান্তিপুর":
     * You MUST apply the requested letter/character/word modification directly to the active field in Form Context!
     * Example: If name was "Ramesh", and user says "ইংরেজিতে এ বদলে ও হবে" or "change a to o", the new name is "Romesh" (or "রোমেশ")!
     * Example: If village was "Rampoor heart" and user says "change it to Rampurhat", the new village is "Rampurhat"!
     * Always output the updated value in the corresponding slot in `slots`!

2. Context & History Awareness:
   - ALWAYS inspect the recent Conversation History to know what field is currently active!
   - If the assistant just asked for village/town (or asked "Is village Rampur correct?"), any place name or correction maps to "village", NEVER to "name"!
   - If the assistant just asked for state, map to "state".
   - If the assistant just asked for name, map to "name".

3. Step-by-Step Workflow & Confirmations:
   - When a field is first input or modified:
     * Extract slot in `slots`.
     * In reply_text: ONLY confirm that specific field in the detected language (e.g., in Bengali: "আপনার নাম সংশোধন করে Romesh করা হয়েছে। এটি কি সঠিক?", in English: "Updated name to Romesh. Is this correct?").
     * DO NOT ask for subsequent fields in the same message!
   - When user confirms ("Yes" / "হ্যাঁ" / "हो" / "Correct"):
     * Move to the next unfilled field (name -> phone -> village -> state).
     * NEVER set intent="SUBMIT_FORM" on "Yes" unless all required fields are filled AND user is explicitly answering yes to submit!
   - When user rejects ("No" / "না" / "नाही"):
     * Ask what they would like to edit.

4. Phone Number Validation:
   - Must be exactly 10 digits.
   - If partial digits (< 10): set slots.phone to current digits, phone_status="partial", reply with remaining digits needed.
   - If user gives remaining digits: concatenate with Form Context to make 10 digits, set phone_status="complete", ask for confirmation.
   - If > 10 digits: set phone_status="excess_digits", slots.phone=null, warn user.

5. Change Page Language (CRITICAL PRIORITY - intent: "CHANGE_LANGUAGE"):
   - When the user asks to change, switch, or set the page/website/UI language (e.g., "পেজের ভাষা ইংরেজি হবে", "পেজের ভাষা বাংলা করো", "change page language to English", "switch to Marathi", "পৃষ্ঠ भाषा इंग्रजी करा", "ভাষা পরিবর্তন করো বাংলায়", "set language to English"):
     * ALWAYS set intent="CHANGE_LANGUAGE", action="CHANGE_LANGUAGE"
     * Set target_language="en" | "mr" | "bn"
     * Set reply_text="পেজের ভাষা ইংরেজিতে পরিবর্তন করা হয়েছে।" (or in target language: "Page language changed to English.")
     * NEVER classify page language requests as FILL_FORM!

6. Explicit Submission ("submit details", "submit form", "ফর্ম জমা দিন", "फॉर्म सबमिट करा"):
   - If all required fields filled: intent="SUBMIT_FORM".
   - If fields missing: intent="FILL_FORM", reply="Please fill missing fields before submitting."

Return JSON ONLY:
{{
  "intent": "NAVIGATE" | "FILL_FORM" | "SUBMIT_FORM" | "CLEAR_FORM" | "CHANGE_LANGUAGE" | "QUESTION" | "UNKNOWN",
  "action": "NAVIGATE" | "FILL_FORM" | "SUBMIT_FORM" | "CLEAR_FORM" | "CHANGE_LANGUAGE" | "NONE",
  "detected_language": "en" | "mr" | "bn",
  "target_language": "en" | "mr" | "bn" | null,
  "target_route_id": "<route_id or null>",
  "target_path": "<path or null>",
  "slots": {{"name": null, "phone": null, "village": null, "state": null}},
  "phone_status": "complete" | "partial" | "excess_digits" | "none",
  "reply_text": "<natural conversational reply in detected language>",
  "confidence": 0.99
}}"""

        if not settings.GROQ_API_KEY:
            return None

        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                headers = {
                    "Authorization": f"Bearer {settings.GROQ_API_KEY}",
                    "Content-Type": "application/json"
                }
                messages = [{"role": "system", "content": system_prompt}]
                
                # Include previous 2~3 user/assistant turns from conversation history
                if conversation_history:
                    for item in conversation_history[-6:]:
                        r = "assistant" if item.get("role") in ["assistant", "ai", "bot"] else "user"
                        txt = str(item.get("text") or item.get("content") or "").strip()
                        if txt:
                            messages.append({"role": r, "content": txt})

                messages.append({"role": "user", "content": f"User speech/text: {query}"})

                payload = {
                    "model": settings.GROQ_LLM_MODEL,
                    "messages": messages,
                    "temperature": 0.1,
                    "max_tokens": 280,
                    "response_format": {"type": "json_object"}
                }
                resp = await client.post("https://api.groq.com/openai/v1/chat/completions", headers=headers, json=payload)
                if resp.status_code == 200:
                    raw_content = resp.json()["choices"][0]["message"]["content"]
                    return json.loads(raw_content)
                else:
                    print(f"[GROQ ERROR] Status: {resp.status_code}, Body: {resp.text}")
                    logger.error(f"Groq error {resp.status_code}: {resp.text}")
                    if resp.status_code == 429:
                        return {"rate_limited": True}
        except Exception as e:
            print(f"[GROQ EXCEPTION]: {e}")
            logger.error(f"Live Groq AI API error: {e}")

        return None

    async def process_voice_command(
        self,
        query: str,
        lang_code: str = "auto",
        preferred_lang: str = "en",
        page_lang: str = "en",
        form_context: Optional[Dict[str, Any]] = None,
        current_path: Optional[str] = None,
        conversation_history: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """
        Processes voice command with auto-language detection, multi-turn form filling,
        user affinity prioritization, latency telemetry, AI reasoning, and phonetic recovery.
        """
        start_time = time.perf_counter()
        clean_query = query.strip()
        
        # Initial heuristic detection
        heuristic_lang = detect_language_heuristic(
            clean_query,
            default_lang="en",
            preferred_lang=preferred_lang,
            page_lang=page_lang
        )
        resolved_lang = heuristic_lang if lang_code == "auto" else lang_code
        lang_cfg = get_language_config(resolved_lang)

        # 1. Check Rate Limits
        limit_check = rate_tracker.check_rate_limit()
        if limit_check.get("is_limited"):
            return {
                "intent": "RATE_LIMITED",
                "action": "NONE",
                "transcript": clean_query,
                "language": lang_cfg.code,
                "detected_language": lang_cfg.code,
                "response_text": "Rate limit threshold reached. Please wait a few seconds before giving another voice command." if lang_cfg.code != "mr" else "कमाल विनंती मर्यादा गाठली आहे. कृपया काही सेकंद थांबा.",
                "target_path": None,
                "confidence": 0.0,
                "telemetry": rate_tracker.get_telemetry()
            }

        if not clean_query:
            return {
                "intent": "UNKNOWN",
                "action": "NONE",
                "transcript": "",
                "language": lang_cfg.code,
                "detected_language": lang_cfg.code,
                "response_text": lang_cfg.default_unknown_msg,
                "target_path": None,
                "confidence": 0.0,
                "telemetry": rate_tracker.get_telemetry()
            }

        # 2. Check if Question / Problem-solving query
        if problem_solver.is_problem_query(clean_query, lang_cfg.code):
            prob_res = await problem_solver.solve_or_explain(
                clean_query,
                lang_code=resolved_lang,
                preferred_lang=preferred_lang,
                page_lang=page_lang
            )
            latency_ms = (time.perf_counter() - start_time) * 1000
            rate_tracker.record_request(latency_ms)
            prob_res["latency_ms"] = round(latency_ms, 2)
            prob_res["detected_language"] = resolved_lang
            prob_res["telemetry"] = rate_tracker.get_telemetry()
            return prob_res

        # 2.5. Fast Language Change Detection
        lower_q = clean_query.lower()
        lang_switch_keywords = [
            "page language", "website language", "change language", "switch language", "set language",
            "পেজের ভাষা", "পৃষ্ঠার ভাষা", "ওয়েবসাইটের ভাষা", "ভাষা পরিবর্তন", "ভাষা ইংরেজি", "ভাষা বাংলা", "ভাষা মারাঠি",
            "ইংরেজিতে পরিবর্তন", "বাংলায় পরিবর্তন", "মারাঠিতে পরিবর্তন",
            "পৃষ্ঠ भाषा", "पेज भाषा", "भाषा बदला", "भाषा इंग्रजी", "भाषा मराठी", "भाषा बंगाली",
            "इंग्रजीत करा", "मराठीत करा", "बंगालीत करा"
        ]
        if any(w in lower_q for w in lang_switch_keywords) or (("language" in lower_q or "ভাষা" in lower_q or "भाषा" in lower_q) and any(l in lower_q for l in ["en", "english", "mr", "marathi", "bn", "bengali", "bangla", "ইংরেজি", "বাংলা", "মারাঠি", "इंग्रजी", "मराठी"])):
            target_l = "en"
            if any(l in lower_q for l in ["bangla", "bengali", "বাংলা", "বাঙলা", "बंगाली", "বংলা", "bn"]):
                target_l = "bn"
            elif any(l in lower_q for l in ["marathi", "मराठी", "মারাঠি", "mr"]):
                target_l = "mr"
            elif any(l in lower_q for l in ["english", "ইংরেজি", "इंग्रजी", "en", "eng"]):
                target_l = "en"

            latency_ms = (time.perf_counter() - start_time) * 1000
            rate_tracker.record_request(latency_ms)

            reply_map = {
                "bn": "পেজের ভাষা ইংরেজিতে পরিবর্তন করা হয়েছে।" if target_l == "en" else "পেজের ভাষা মারাঠিতে পরিবর্তন করা হয়েছে।" if target_l == "mr" else "পেজের ভাষা বাংলায় পরিবর্তন করা হয়েছে।",
                "mr": "पृष्ठ भाषा इंग्रजीमध्ये बदलली आहे." if target_l == "en" else "पृष्ठ भाषा मराठीमध्ये बदलली आहे." if target_l == "mr" else "पृष्ठ भाषा बंगालीमध्ये बदलली आहे.",
                "en": f"Page language changed to {'English' if target_l == 'en' else 'Marathi' if target_l == 'mr' else 'Bengali'}."
            }
            return {
                "intent": "CHANGE_LANGUAGE",
                "action": "CHANGE_LANGUAGE",
                "target_language": target_l,
                "transcript": clean_query,
                "language": resolved_lang,
                "detected_language": resolved_lang,
                "confidence": 0.99,
                "latency_ms": round(latency_ms, 2),
                "response_text": reply_map.get(resolved_lang, f"Page language updated to {target_l}."),
                "telemetry": rate_tracker.get_telemetry()
            }

        # 3. Live AI Intent & Slot Processing via Groq
        ai_res = await self._classify_with_groq_ai(
            clean_query,
            lang_code=lang_code,
            preferred_lang=preferred_lang,
            page_lang=page_lang,
            form_context=form_context,
            current_path=current_path,
            conversation_history=conversation_history
        )
        latency_ms = (time.perf_counter() - start_time) * 1000
        rate_tracker.record_request(latency_ms)

        if ai_res and not ai_res.get("rate_limited"):
            ai_detected_lang = ai_res.get("detected_language") or resolved_lang
            final_lang_cfg = get_language_config(ai_detected_lang)
            ai_intent = ai_res.get("intent", "").upper()
            target_route_id = ai_res.get("target_route_id")

            # A. FORM FILLING INTENT
            if ai_intent == "FILL_FORM":
                extracted_slots = ai_res.get("slots", {})
                cleaned_slots = {k: v for k, v in extracted_slots.items() if v is not None}
                phone_status = ai_res.get("phone_status", "none")
                reply_msg = ai_res.get("reply_text", "Form updated.")
                
                # Check phone number validity (> 10 digits)
                if "phone" in cleaned_slots:
                    raw_phone = str(cleaned_slots["phone"]).strip()
                    digits_only = "".join(filter(str.isdigit, raw_phone))
                    
                    # Merge phone with existing form context if partial
                    if form_context and form_context.get("phone"):
                        prev_phone = str(form_context.get("phone", "")).strip()
                        prev_digits = "".join(filter(str.isdigit, prev_phone))
                        if prev_digits and len(prev_digits) < 10 and digits_only and not digits_only.startswith(prev_digits):
                            combined = prev_digits + digits_only
                            if len(combined) > 10:
                                cleaned_slots.pop("phone", None)
                                phone_status = "excess_digits"
                                reply_msg = f"ফোন নম্বর ১০ সংখ্যার বেশি ({len(combined)} সংখ্যা) হতে পারে না। অনুগ্রহ করে সঠিক ১০ সংখ্যার নম্বর বলুন।" if final_lang_cfg.code == "bn" else f"फोन नंबर १० अंकांपेक्षा जास्त ({len(combined)} अंक) असू शकत नाही. कृपया योग्य १० अंकी नंबर सांगा." if final_lang_cfg.code == "mr" else f"Phone number cannot exceed 10 digits (got {len(combined)}). Please state the 10-digit number."
                            else:
                                cleaned_slots["phone"] = combined
                                digits_only = combined

                    if "phone" in cleaned_slots:
                        if len(digits_only) > 10:
                            cleaned_slots.pop("phone", None)
                            phone_status = "excess_digits"
                            reply_msg = f"ফোন নম্বর ১০ সংখ্যার বেশি ({len(digits_only)} সংখ্যা) হতে পারে না। অনুগ্রহ করে সঠিক ১০ সংখ্যার নম্বর বলুন।" if final_lang_cfg.code == "bn" else f"फोन नंबर १० अंकांपेक्षा जास्त ({len(digits_only)} अंक) असू शकत नाही. कृपया योग्य १० अंकी नंबर सांगा." if final_lang_cfg.code == "mr" else f"Phone number cannot exceed 10 digits (got {len(digits_only)}). Please provide a valid 10-digit number."
                        elif len(digits_only) == 10:
                            cleaned_slots["phone"] = digits_only
                            phone_status = "complete"
                        elif len(digits_only) > 0:
                            cleaned_slots["phone"] = digits_only
                            phone_status = "partial"

                return {
                    "intent": "FILL_FORM",
                    "action": "FILL_FORM",
                    "transcript": clean_query,
                    "language": final_lang_cfg.code,
                    "detected_language": final_lang_cfg.code,
                    "target_path": "/signup",
                    "form_data": cleaned_slots,
                    "phone_status": phone_status,
                    "confidence": float(ai_res.get("confidence", 0.98)),
                    "latency_ms": round(latency_ms, 2),
                    "response_text": reply_msg,
                    "telemetry": rate_tracker.get_telemetry()
                }

            # B. SUBMIT FORM INTENT
            elif ai_intent == "SUBMIT_FORM":
                return {
                    "intent": "SUBMIT_FORM",
                    "action": "SUBMIT_FORM",
                    "transcript": clean_query,
                    "language": final_lang_cfg.code,
                    "detected_language": final_lang_cfg.code,
                    "target_path": "/signup",
                    "confidence": float(ai_res.get("confidence", 0.98)),
                    "latency_ms": round(latency_ms, 2),
                    "response_text": ai_res.get("reply_text") or (
                        "ফর্ম জমা দেওয়া হচ্ছে।" if final_lang_cfg.code == "bn" else "फॉर्म सबमिट केला जात आहे." if final_lang_cfg.code == "mr" else "Submitting the registration form now."
                    ),
                    "telemetry": rate_tracker.get_telemetry()
                }

            # C. CLEAR FORM INTENT
            elif ai_intent == "CLEAR_FORM":
                return {
                    "intent": "CLEAR_FORM",
                    "action": "CLEAR_FORM",
                    "transcript": clean_query,
                    "language": final_lang_cfg.code,
                    "detected_language": final_lang_cfg.code,
                    "target_path": "/signup",
                    "confidence": float(ai_res.get("confidence", 0.98)),
                    "latency_ms": round(latency_ms, 2),
                    "response_text": ai_res.get("reply_text") or (
                        "ফর্ম রিসেট করা হয়েছে।" if final_lang_cfg.code == "bn" else "फॉर्म रीसेट केला आहे." if final_lang_cfg.code == "mr" else "Form has been cleared."
                    ),
                    "telemetry": rate_tracker.get_telemetry()
                }
            
            # D. CHANGE PAGE LANGUAGE INTENT
            elif ai_intent == "CHANGE_LANGUAGE" or ai_res.get("action") == "CHANGE_LANGUAGE":
                target_l = ai_res.get("target_language") or ("bn" if "বাংলা" in clean_query else "mr" if "मराठी" in clean_query else "en")
                return {
                    "intent": "CHANGE_LANGUAGE",
                    "action": "CHANGE_LANGUAGE",
                    "target_language": target_l,
                    "transcript": clean_query,
                    "language": final_lang_cfg.code,
                    "detected_language": final_lang_cfg.code,
                    "confidence": float(ai_res.get("confidence", 0.98)),
                    "latency_ms": round(latency_ms, 2),
                    "response_text": ai_res.get("reply_text") or (
                        "পেজের ভাষা ইংরেজিতে পরিবর্তন করা হয়েছে।" if target_l == "en" and final_lang_cfg.code == "bn" else "পেজের ভাষা পরিবর্তন করা হয়েছে।" if final_lang_cfg.code == "bn" else "पृष्ठ भाषा बदलली आहे." if final_lang_cfg.code == "mr" else "Page language updated."
                    ),
                    "telemetry": rate_tracker.get_telemetry()
                }

            # E. PAGE NAVIGATION INTENT
            elif ai_intent == "NAVIGATE" and target_route_id:
                matched_route = next((r for r in self.routes_data if r["route_id"] == target_route_id), None)
                if matched_route:
                    page_name = matched_route.get(f"name_{final_lang_cfg.code}", matched_route["name_en"])
                    return {
                        "intent": "NAVIGATE",
                        "action": "NAVIGATE",
                        "transcript": clean_query,
                        "language": final_lang_cfg.code,
                        "detected_language": final_lang_cfg.code,
                        "route_id": matched_route["route_id"],
                        "target_path": matched_route["path"],
                        "target_name": page_name,
                        "confidence": float(ai_res.get("confidence", 0.98)),
                        "match_type": "live_groq_ai",
                        "model": settings.GROQ_LLM_MODEL,
                        "latency_ms": round(latency_ms, 2),
                        "response_text": ai_res.get("reply_text") or (
                            f"{page_name} পৃষ্ঠায় নিয়ে যাওয়া হচ্ছে।" if final_lang_cfg.code == "bn" else f"{page_name} पृष्ठावर नेत आहे." if final_lang_cfg.code == "mr" else f"Navigating to {page_name}."
                        ),
                        "telemetry": rate_tracker.get_telemetry()
                    }
            
            # F. INFORMATIONAL QUESTION
            elif ai_intent == "QUESTION":
                return {
                    "intent": "PROBLEM_SOLVING",
                    "action": "NONE",
                    "transcript": clean_query,
                    "language": final_lang_cfg.code,
                    "detected_language": final_lang_cfg.code,
                    "status": "answered_by_ai",
                    "confidence": float(ai_res.get("confidence", 0.98)),
                    "latency_ms": round(latency_ms, 2),
                    "response_text": ai_res.get("reply_text", ""),
                    "telemetry": rate_tracker.get_telemetry()
                }



        # 4. Resilient Local Form & Slot Fallback (If Groq rate limited or offline)
        if current_path == "/signup" or "signup" in clean_query.lower() or "form" in clean_query.lower():
            fc = form_context or {}
            
            # Explicit Submit action
            if any(w in lower_q for w in ["submit details", "submit form", "submit registration", "সবমিট करा", "ফর্ম জমা দিন", "জমা দিন"]):
                has_name = bool(fc.get("name"))
                has_phone = bool(fc.get("phone") and len(str(fc.get("phone"))) == 10)
                has_village = bool(fc.get("village"))
                has_state = bool(fc.get("state"))
                
                if has_name and has_phone and has_village and has_state:
                    return {
                        "intent": "SUBMIT_FORM",
                        "action": "SUBMIT_FORM",
                        "transcript": clean_query,
                        "language": lang_cfg.code,
                        "detected_language": lang_cfg.code,
                        "target_path": "/signup",
                        "confidence": 0.95,
                        "latency_ms": round(latency_ms, 2),
                        "response_text": "ফর্ম জমা দেওয়া হচ্ছে।" if lang_cfg.code == "bn" else "फॉर्म सबमिट केला जात आहे." if lang_cfg.code == "mr" else "Submitting the registration form now.",
                        "telemetry": rate_tracker.get_telemetry()
                    }
                else:
                    missing = []
                    if not has_name: missing.append("name")
                    if not has_phone: missing.append("phone")
                    if not has_village: missing.append("village")
                    if not has_state: missing.append("state")
                    miss_str = ", ".join(missing)
                    return {
                        "intent": "FILL_FORM",
                        "action": "FILL_FORM",
                        "transcript": clean_query,
                        "language": lang_cfg.code,
                        "detected_language": lang_cfg.code,
                        "target_path": "/signup",
                        "form_data": {},
                        "confidence": 0.95,
                        "latency_ms": round(latency_ms, 2),
                        "response_text": f"Please fill the missing fields ({miss_str}) before submitting.",
                        "telemetry": rate_tracker.get_telemetry()
                    }

            # Conversational "Yes" / Confirmation
            if any(lower_q == w or lower_q.startswith(w + " ") for w in ["yes", "yeah", "yep", "হ্যাঁ", "হাঁ", "हो", "होय", "correct", "right", "confirm"]):
                if not fc.get("phone") or len(str(fc.get("phone", ""))) < 10:
                    msg = "Great. Please provide your 10-digit phone number." if lang_cfg.code == "en" else "छान. कृपया तुमचा १० अंकी फोन नंबर सांगा." if lang_cfg.code == "mr" else "ঠিক আছে। অনুগ্রহ করে আপনার ১০ সংখ্যার ফোন নম্বর বলুন।"
                elif not fc.get("village"):
                    msg = "Got it. Please provide your village or town name." if lang_cfg.code == "en" else "समजले. कृपया तुमच्या गावाचे नाव सांगा." if lang_cfg.code == "mr" else "ঠিক আছে। আপনার গ্রাম বা শহরের নাম বলুন।"
                elif not fc.get("state"):
                    msg = "Got it. What is your state name?" if lang_cfg.code == "en" else "समजले. तुमचे राज्य कोणते आहे?" if lang_cfg.code == "mr" else "ঠিক আছে। আপনার রাজ্যের নাম বলুন।"
                else:
                    msg = "All details are complete! Would you like to submit the registration?" if lang_cfg.code == "en" else "सर्व तपशील पूर्ण झाले आहेत! आपण नोंदणी सबमिट करू इच्छिता?" if lang_cfg.code == "mr" else "সব বিবরণ সম্পূর্ণ! আপনি কি ফর্মটি জমা দিতে চান?"

                return {
                    "intent": "FILL_FORM",
                    "action": "FILL_FORM",
                    "transcript": clean_query,
                    "language": lang_cfg.code,
                    "detected_language": lang_cfg.code,
                    "target_path": "/signup",
                    "form_data": {},
                    "confidence": 0.95,
                    "latency_ms": round(latency_ms, 2),
                    "response_text": msg,
                    "telemetry": rate_tracker.get_telemetry()
                }

            # Conversational "No" / Rejection
            if any(lower_q == w or lower_q.startswith(w + " ") for w in ["no", "nah", "না", "नाही", "wrong", "incorrect", "ভুল", "चुकीचे"]):
                return {
                    "intent": "FILL_FORM",
                    "action": "FILL_FORM",
                    "transcript": clean_query,
                    "language": lang_cfg.code,
                    "detected_language": lang_cfg.code,
                    "target_path": "/signup",
                    "form_data": {},
                    "confidence": 0.95,
                    "latency_ms": round(latency_ms, 2),
                    "response_text": "Understood. What would you like to edit or correct?" if lang_cfg.code == "en" else "समजले. आपण काय बदलू इच्छिता?" if lang_cfg.code == "mr" else "বুঝেছি। আপনি কী সংশোধন করতে চান?",
                    "telemetry": rate_tracker.get_telemetry()
                }

            # Clear action
            if any(w in lower_q for w in ["clear", "reset", "साফ", "রিসেট", "cancel"]):
                return {
                    "intent": "CLEAR_FORM",
                    "action": "CLEAR_FORM",
                    "transcript": clean_query,
                    "language": lang_cfg.code,
                    "detected_language": lang_cfg.code,
                    "target_path": "/signup",
                    "confidence": 0.95,
                    "latency_ms": round(latency_ms, 2),
                    "response_text": "ফর্ম রিসেট করা হয়েছে।" if lang_cfg.code == "bn" else "फॉर्म रीसेट केला आहे." if lang_cfg.code == "mr" else "Form has been cleared.",
                    "telemetry": rate_tracker.get_telemetry()
                }

            # Local slot extraction heuristics
            extracted: Dict[str, Any] = {}
            import re
            
            # Phone digits
            digits_found = "".join(re.findall(r'\d+', clean_query))
            phone_status = "none"
            if digits_found:
                # Merge phone with existing form context if partial
                if fc and fc.get("phone"):
                    prev_p = str(fc.get("phone", "")).strip()
                    if prev_p and len(prev_p) < 10 and not digits_found.startswith(prev_p):
                        combined_p = prev_p + digits_found
                        if len(combined_p) > 10:
                            phone_status = "excess_digits"
                        elif len(combined_p) == 10:
                            extracted["phone"] = combined_p
                            phone_status = "complete"
                        else:
                            extracted["phone"] = combined_p
                            phone_status = "partial"
                    else:
                        if len(digits_found) > 10:
                            phone_status = "excess_digits"
                        elif len(digits_found) == 10:
                            extracted["phone"] = digits_found
                            phone_status = "complete"
                        else:
                            extracted["phone"] = digits_found
                            phone_status = "partial"
                else:
                    if len(digits_found) > 10:
                        phone_status = "excess_digits"
                    elif len(digits_found) == 10:
                        extracted["phone"] = digits_found
                        phone_status = "complete"
                    else:
                        extracted["phone"] = digits_found
                        phone_status = "partial"

            # Village
            v_match = re.search(r'(?:village|गाव|ग्राम|town)\s+([A-Za-z\u0900-\u097F\u0980-\u09FF]+)', clean_query, re.I)
            if v_match:
                extracted["village"] = v_match.group(1).strip()

            # State
            s_match = re.search(r'(?:state|राज्य|রাজ্য)\s+([A-Za-z\u0900-\u097F\u0980-\u09FF]+)', clean_query, re.I)
            if s_match:
                extracted["state"] = s_match.group(1).strip()

            # Name
            n_match = re.search(r'(?:my name is|name is|name|माझं नाव|माझे नाव|नाव|আমার নাম|নাম)\s+([A-Za-z\u0900-\u097F\u0980-\u09FF]+(?:\s+[A-Za-z\u0900-\u097F\u0980-\u09FF]+)?)', clean_query, re.I)
            if n_match:
                extracted["name"] = n_match.group(1).strip()


            if extracted or phone_status == "excess_digits":
                # Formulate intelligent polite spoken guidance
                msg = "Details updated."
                if phone_status == "excess_digits":
                    msg = "Phone number cannot exceed 10 digits. Please state a valid 10-digit number." if lang_cfg.code == "en" else "फोन नंबर १० अंकांपेक्षा जास्त असू शकत नाही. कृपया योग्य १० अंकी नंबर सांगा." if lang_cfg.code == "mr" else "ফোন নম্বর ১০ সংখ্যার বেশি হতে পারে না। অনুগ্রহ করে সঠিক ১০ সংখ্যার নম্বর বলুন।"
                elif "name" in extracted and "phone" not in extracted:
                    msg = f"Recorded your name as {extracted['name']}. Is this correct?" if lang_cfg.code == "en" else f"तुमचे नाव {extracted['name']} नोंदवले आहे. हे बरोबर आहे का?" if lang_cfg.code == "mr" else f"আপনার নাম {extracted['name']} নেওয়া হয়েছে। এটি কি সঠিক?"
                elif "phone" in extracted:
                    p_len = len(extracted["phone"])
                    if p_len < 10:
                        rem = 10 - p_len
                        msg = f"Noted {extracted['phone']} ({p_len} digits). Please mention the remaining {rem} digits." if lang_cfg.code == "en" else f"{extracted['phone']} नोंदवले ({p_len} अंक). कृपया उर्वरित {rem} अंक सांगा." if lang_cfg.code == "mr" else f"{extracted['phone']} ({p_len}টি সংখ্যা) নেওয়া হয়েছে। বাকি {rem}টি সংখ্যা বলুন।"
                    else:
                        msg = f"Phone number recorded as {extracted['phone']}. Is this correct?" if lang_cfg.code == "en" else f"फोन नंबर {extracted['phone']} नोंदवला आहे. हे बरोबर आहे का?" if lang_cfg.code == "mr" else f"ফোন নম্বর {extracted['phone']} নেওয়া হয়েছে। এটি কি সঠিক?"
                elif "village" in extracted and "state" not in extracted:
                    msg = f"Recorded village as {extracted['village']}. Is this correct?" if lang_cfg.code == "en" else f"गाव {extracted['village']} नोंदवले आहे. हे बरोबर आहे का?" if lang_cfg.code == "mr" else f"গ্রাম {extracted['village']} নেওয়া হয়েছে। এটি কি সঠিক?"
                elif "state" in extracted and "village" not in extracted:
                    msg = f"Recorded state as {extracted['state']}. Is this correct?" if lang_cfg.code == "en" else f"राज्य {extracted['state']} नोंदवले आहे. हे बरोबर आहे का?" if lang_cfg.code == "mr" else f"রাজ্য {extracted['state']} নেওয়া হয়েছে। এটি কি সঠিক?"
                elif "village" in extracted and "state" in extracted:
                    msg = f"Recorded village as {extracted['village']} and state as {extracted['state']}. Is this correct?" if lang_cfg.code == "en" else f"गाव {extracted['village']} आणि राज्य {extracted['state']} नोंदवले आहे. हे बरोबर आहे का?" if lang_cfg.code == "mr" else f"গ্রাম {extracted['village']} এবং রাজ্য {extracted['state']} নেওয়া হয়েছে। এটি কি সঠিক?"
                elif "preferred_language" in extracted:
                    msg = "Preferred language selected. Is this correct?" if lang_cfg.code == "en" else "पसंतीची भाषा निवडली आहे. हे बरोबर आहे का?" if lang_cfg.code == "mr" else "পছন্দের ভাষা নির্বাচন করা হয়েছে। এটি কি সঠিক?"

                return {
                    "intent": "FILL_FORM",
                    "action": "FILL_FORM",
                    "transcript": clean_query,
                    "language": lang_cfg.code,
                    "detected_language": lang_cfg.code,
                    "target_path": "/signup",
                    "form_data": extracted,
                    "phone_status": phone_status,
                    "confidence": 0.96,
                    "latency_ms": round(latency_ms, 2),
                    "response_text": msg,
                    "telemetry": rate_tracker.get_telemetry()
                }

        # 5. Phonetic & Acoustic Fuzzy Recovery (Fallback for standard navigation)
        fuzzy_match = self.find_fuzzy_phonetic_match(clean_query, lang_cfg.code)
        if fuzzy_match and current_path != "/signup":
            route = fuzzy_match["route"]
            page_name = route.get(f"name_{lang_cfg.code}", route["name_en"])
            if lang_cfg.code == "bn":
                reply = f"{page_name} পৃষ্ঠায় নিয়ে যাওয়া হচ্ছে।"
            elif lang_cfg.code == "mr":
                reply = f"{page_name} पृष्ठावर नेत आहे."
            else:
                reply = f"Navigating to {page_name}."
            return {
                "intent": "NAVIGATE",
                "action": "NAVIGATE",
                "transcript": clean_query,
                "language": lang_cfg.code,
                "detected_language": lang_cfg.code,
                "route_id": route["route_id"],
                "target_path": route["path"],
                "target_name": page_name,
                "confidence": round(fuzzy_match["score"] / 100.0, 2),
                "match_type": "phonetic_fuzzy_recovery",
                "model": "phonetic_noise_corrector",
                "latency_ms": round(latency_ms, 2),
                "response_text": reply,
                "telemetry": rate_tracker.get_telemetry()
            }

        # 6. Unknown Query Result
        return {
            "intent": "UNKNOWN",
            "action": "NONE",
            "transcript": clean_query,
            "language": lang_cfg.code,
            "detected_language": lang_cfg.code,
            "target_path": None,
            "confidence": 0.0,
            "latency_ms": round(latency_ms, 2),
            "response_text": lang_cfg.default_unknown_msg,
            "telemetry": rate_tracker.get_telemetry()
        }

intent_engine = NavigationIntentEngine()


