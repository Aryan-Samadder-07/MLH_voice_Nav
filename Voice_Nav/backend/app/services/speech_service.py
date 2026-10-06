import logging
import httpx
from typing import Dict, Any, Optional
from app.core.config import settings
from app.core.languages import get_language_config

logger = logging.getLogger(__name__)

# Connection-pooled HTTP client
http_client = httpx.AsyncClient(timeout=15.0)

class MultilingualSpeechService:
    """
    Multilingual STT (Speech-to-Text) & TTS (Text-to-Speech) service layer.
    Powered by Groq Whisper Large v3 for ultra-low latency Indic STT.
    """

    async def transcribe_audio_api(self, audio_bytes: bytes, filename: str, lang_code: str = "en") -> Dict[str, Any]:
        """
        Transcribes audio using Groq Whisper Large v3 (sub-200ms latency).
        """
        lang_cfg = get_language_config(lang_code)
        
        # 1. Groq Whisper Large v3 (Primary STT Engine)
        if settings.GROQ_API_KEY:
            try:
                headers = {"Authorization": f"Bearer {settings.GROQ_API_KEY}"}
                files = {"file": (filename, audio_bytes, "audio/wav")}
                data = {
                    "model": settings.GROQ_WHISPER_MODEL,
                    "language": "bn" if lang_cfg.code == "bn" else "mr" if lang_cfg.code == "mr" else "en",
                    "temperature": "0.0",
                    "response_format": "json"
                }
                response = await http_client.post(
                    "https://api.groq.com/openai/v1/audio/transcriptions",
                    headers=headers,
                    files=files,
                    data=data
                )
                if response.status_code == 200:
                    result = response.json()
                    return {
                        "success": True,
                        "text": result.get("text", "").strip(),
                        "provider": "groq_whisper_large_v3",
                        "language": lang_cfg.code
                    }
                else:
                    logger.warning(f"Groq STT returned status {response.status_code}: {response.text}")
            except Exception as e:
                logger.warning(f"Groq Whisper STT call failed: {e}")

        # 2. Sarvam Indic STT fallback if present
        if settings.SARVAM_API_KEY and lang_code == "mr":
            try:
                headers = {"api-subscription-key": settings.SARVAM_API_KEY}
                files = {"file": (filename, audio_bytes, "audio/wav")}
                data = {"language_code": "mr-IN", "model": "saarika:v1"}
                response = await http_client.post("https://api.sarvam.ai/speech-to-text", headers=headers, files=files, data=data)
                if response.status_code == 200:
                    result = response.json()
                    return {
                        "success": True,
                        "text": result.get("transcript", "").strip(),
                        "provider": "sarvam_saarika",
                        "language": "mr"
                    }
            except Exception as e:
                logger.warning(f"Sarvam STT failed: {e}")

        return {
            "success": False,
            "text": "",
            "message": "Cloud STT API key not configured; using browser Web Speech API",
            "provider": "browser_fallback"
        }

    async def synthesize_speech_api(self, text: str, lang_code: str = "en") -> Dict[str, Any]:
        """
        Generates TTS metadata and optional audio stream for the given language.
        """
        lang_cfg = get_language_config(lang_code)

        # 1. Sarvam Bulbul Indic TTS (if key configured)
        if settings.SARVAM_API_KEY and lang_code in ["mr", "hi"]:
            try:
                headers = {
                    "api-subscription-key": settings.SARVAM_API_KEY,
                    "Content-Type": "application/json"
                }
                payload = {
                    "inputs": [text],
                    "target_language_code": f"{lang_code}-IN",
                    "speaker": "meera",
                    "model": "bulbul:v1"
                }
                response = await http_client.post("https://api.sarvam.ai/text-to-speech", headers=headers, json=payload)
                if response.status_code == 200:
                    data = response.json()
                    audios = data.get("audios", [])
                    if audios:
                        return {
                            "success": True,
                            "audio_base64": audios[0],
                            "audio_format": "wav",
                            "provider": "sarvam_bulbul",
                            "text": text,
                            "language": lang_cfg.code
                        }
            except Exception as e:
                logger.warning(f"Sarvam TTS failed: {e}")

        # Browser Native SpeechSynthesis payload
        return {
            "success": True,
            "audio_base64": None,
            "provider": "browser_synthesis",
            "text": text,
            "language": lang_cfg.code,
            "locale": lang_cfg.locale,
            "voice_hints": lang_cfg.tts_voice_hints
        }

speech_service = MultilingualSpeechService()
