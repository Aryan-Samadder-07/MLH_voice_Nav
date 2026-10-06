import os
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseModel):
    APP_NAME: str = "Voice Navigation AI Assistant"
    API_PREFIX: str = "/api"
    DEBUG: bool = os.getenv("DEBUG", "True").lower() in ("true", "1")
    
    # Cloud AI API Keys
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    SILICONFLOW_API_KEY: str = os.getenv("SILICONFLOW_API_KEY", "")
    SARVAM_API_KEY: str = os.getenv("SARVAM_API_KEY", "")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    KRUTRIM_API_KEY: str = os.getenv("KRUTRIM_API_KEY", "")
    
    # Model Configurations (Active Groq Qwen/Llama)
    SILICONFLOW_MODEL: str = os.getenv("SILICONFLOW_MODEL", "Qwen/Qwen2.5-7B-Instruct")
    GROQ_LLM_MODEL: str = os.getenv("GROQ_LLM_MODEL", "qwen/qwen3.8-27b")
    GROQ_WHISPER_MODEL: str = os.getenv("GROQ_WHISPER_MODEL", "whisper-large-v3")
    
    # Default Provider selection: "siliconflow" | "groq" | "rule_based"
    DEFAULT_LLM_PROVIDER: str = os.getenv("DEFAULT_LLM_PROVIDER", "groq")
    
    # TTS & STT Provider: "browser" | "groq" | "sarvam"
    DEFAULT_TTS_PROVIDER: str = os.getenv("DEFAULT_TTS_PROVIDER", "browser")
    DEFAULT_STT_PROVIDER: str = os.getenv("DEFAULT_STT_PROVIDER", "groq")
    
    # CORS
    ALLOWED_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*"
    ]

settings = Settings()

