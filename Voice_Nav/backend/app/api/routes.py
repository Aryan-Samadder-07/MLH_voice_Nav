from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

from app.core.languages import list_supported_languages, get_language_config
from app.services.intent_engine import intent_engine
from app.services.speech_service import speech_service
from app.services.problem_solver import problem_solver
from app.services.rate_limiter import rate_tracker

from app.core.database import insert_user, list_users, delete_user

router = APIRouter(prefix="/assistant", tags=["AI Assistant"])

@router.get("/stats")
async def get_assistant_stats():
    """Returns real-time rate limit counters and latency telemetry."""
    return {"telemetry": rate_tracker.get_telemetry()}

class SignupRequest(BaseModel):
    name: str = Field(..., description="Full Name")
    phone: str = Field(..., description="10-digit Phone Number")
    village: str = Field(..., description="Village Name")
    state: str = Field(..., description="State Name")
    preferred_language: str = Field("en", description="Preferred Language Code (e.g. en, mr, bn)")

class ProcessVoiceRequest(BaseModel):
    text: str = Field(..., description="Recognized speech text or typed command")
    language: str = Field("auto", description="Language code e.g. 'auto', 'en', or 'mr'")
    preferred_language: Optional[str] = Field("en", description="User's historical preferred language affinity")
    page_language: Optional[str] = Field("en", description="Current page UI language")
    current_path: Optional[str] = Field(None, description="Current user route in web app")
    form_context: Optional[Dict[str, Any]] = Field(None, description="Current active form field states for contextual slot-filling")
    conversation_history: Optional[List[Dict[str, Any]]] = Field(default_factory=list, description="Recent conversation history turns for multi-turn slot resolution")

@router.post("/signup")
async def register_user(payload: SignupRequest):
    """Saves a new user registration to the local SQLite database."""
    if not payload.name.strip():
        raise HTTPException(status_code=400, detail="Name is required.")
    if not payload.phone.strip():
        raise HTTPException(status_code=400, detail="Phone number is required.")
    
    created = insert_user(
        name=payload.name,
        phone=payload.phone,
        village=payload.village,
        state=payload.state,
        preferred_language=payload.preferred_language
    )
    return {"status": "success", "message": "User registered successfully", "user": created}

@router.get("/users")
async def get_all_users():
    """Fetches all registered users from the local SQLite database."""
    users = list_users()
    return {"status": "success", "users": users, "count": len(users)}

@router.delete("/users/{user_id}")
async def remove_user(user_id: int):
    """Deletes a registered user by ID from the local SQLite database."""
    success = delete_user(user_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"User with ID {user_id} not found.")
    return {"status": "success", "message": f"User {user_id} deleted."}

class TrainUtteranceRequest(BaseModel):
    route_id: str = Field(..., description="Unique ID of route, e.g. 'profile', 'analytics'")
    utterance: str = Field(..., description="Voice phrase in English or Marathi")
    language: str = Field("en", description="Language of utterance ('en' or 'mr')")

class ProblemSolveRequest(BaseModel):
    query: str = Field(..., description="Problem description or question")
    language: str = Field("auto", description="Language code ('auto', 'en', or 'mr')")
    preferred_language: Optional[str] = Field("en", description="User's preferred language")
    page_language: Optional[str] = Field("en", description="Current page language")
    context: Optional[Dict[str, Any]] = None

@router.get("/languages")
async def get_languages():
    """Returns list of supported multilingual languages."""
    return {"languages": list_supported_languages()}

@router.get("/routes")
async def get_nav_routes():
    """Returns all currently registered and trainable routes with their phrases."""
    return {"routes": intent_engine.get_all_routes()}

@router.post("/process")
async def process_voice_command(payload: ProcessVoiceRequest):
    """
    Main processing endpoint:
    Classifies intent, auto-detects language, determines page navigation, and returns multilingual voice response.
    """
    result = await intent_engine.process_voice_command(
        query=payload.text,
        lang_code=payload.language or "auto",
        preferred_lang=payload.preferred_language or "en",
        page_lang=payload.page_language or "en",
        form_context=payload.form_context,
        current_path=payload.current_path,
        conversation_history=payload.conversation_history
    )
    
    detected_lang = result.get("language") or result.get("detected_language") or "en"

    # Get speech synthesis hints or cloud audio in detected language
    tts_result = await speech_service.synthesize_speech_api(
        text=result.get("response_text", ""),
        lang_code=detected_lang
    )
    
    return {
        "status": "success",
        "result": result,
        "tts": tts_result
    }

@router.post("/train")
async def train_route_utterance(payload: TrainUtteranceRequest):
    """
    Dynamically trains the AI assistant with a new custom voice phrase.
    """
    res = intent_engine.train_utterance(
        route_id=payload.route_id,
        utterance=payload.utterance,
        lang_code=payload.language
    )
    if not res.get("success"):
        raise HTTPException(status_code=400, detail=res.get("message"))
    return res

@router.post("/tts")
async def synthesize_tts(text: str, language: str = "en"):
    """
    Synthesizes speech for the given text and language.
    """
    return await speech_service.synthesize_speech_api(text=text, lang_code=language)

@router.post("/stt")
async def transcribe_audio(
    audio_file: UploadFile = File(...),
    language: str = Form("en")
):
    """
    Transcribes uploaded audio bytes via Cloud STT APIs (Groq / Sarvam / Krutrim).
    """
    content = await audio_file.read()
    return await speech_service.transcribe_audio_api(
        audio_bytes=content,
        filename=audio_file.filename or "audio.wav",
        lang_code=language
    )

@router.post("/problem-solve")
async def solve_problem(payload: ProblemSolveRequest):
    """
    Modular problem solver hook for future ML pipeline and Q&A integrations.
    """
    return await problem_solver.solve_or_explain(
        query=payload.query,
        lang_code=payload.language,
        context=payload.context
    )
