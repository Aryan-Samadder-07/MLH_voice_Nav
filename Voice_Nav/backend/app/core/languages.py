from typing import Dict, Any, List
from pydantic import BaseModel

class LanguageConfig(BaseModel):
    code: str              # ISO code: "en", "mr", "hi", etc.
    locale: str            # Locale: "en-IN" / "en-US", "mr-IN"
    name: str              # Display name in English
    native_name: str       # Display name in native script
    script: str            # e.g. Latin, Devanagari
    tts_voice_hints: List[str] # Preferred TTS voice names
    default_prompt_greeting: str
    default_unknown_msg: str
    nav_ack_templates: List[str] # Templates for acknowledging navigation

# Extensible Multilingual Registry
SUPPORTED_LANGUAGES: Dict[str, LanguageConfig] = {
    "en": LanguageConfig(
        code="en",
        locale="en-IN",
        name="English",
        native_name="English",
        script="Latin",
        tts_voice_hints=["Google UK English Female", "Microsoft Heera", "en-IN", "en-US"],
        default_prompt_greeting="Hello! I am your AI navigation assistant. How can I help you navigate or answer your questions?",
        default_unknown_msg="I could not find a matching page for that command. Try asking for Dashboard, Analytics, Profile, Settings, Diagnostics, or Help.",
        nav_ack_templates=[
            "Navigating to {page_name} page now.",
            "Opening {page_name} for you.",
            "Sure, taking you to {page_name}."
        ]
    ),
    "mr": LanguageConfig(
        code="mr",
        locale="mr-IN",
        name="Marathi",
        native_name="मराठी",
        script="Devanagari",
        tts_voice_hints=["Google मराठी", "mr-IN", "Microsoft Kalpana", "Devanagari"],
        default_prompt_greeting="नमस्कार! मी तुमचा AI सहाय्यक आहे. मी तुम्हाला पानांवर नेण्यास किंवा मदत करण्यास तयार आहे.",
        default_unknown_msg="माफ करा, मला या आदेशासाठी कोणतेही पृष्ठ सापडले नाही. तुम्ही डॅशबोर्ड, ॲनालिटिक्स, प्रोफाईल, सेटिंग्ज किंवा मदत विचारू शकता.",
        nav_ack_templates=[
            "{page_name} पृष्ठावर जात आहे.",
            "तुमच्यासाठी {page_name} उघडत आहे.",
            "होय, {page_name} पृष्ठ दाखवत आहे."
        ]
    ),
    "bn": LanguageConfig(
        code="bn",
        locale="bn-IN",
        name="Bengali",
        native_name="বাংলা",
        script="Bengali",
        tts_voice_hints=["Google বাংলা", "bn-IN", "bn-BD", "Microsoft Tanishaa", "Bengali"],
        default_prompt_greeting="নমস্কার! আমি আপনার AI নেভিগেশন সহায়ক। আমি কীভাবে আপনাকে সাহায্য করতে পারি?",
        default_unknown_msg="দুঃখিত, এই নির্দেশের জন্য কোনো পৃষ্ঠা খুঁজে পাওয়া যায়নি। আপনি ড্যাশবোর্ড, অ্যানালিটিক্স, প্রোফাইল, সেটিংস বা সাহায্য দেখতে পারেন।",
        nav_ack_templates=[
            "{page_name} পৃষ্ঠায় নিয়ে যাওয়া হচ্ছে।",
            "আপনার জন্য {page_name} খোলা হচ্ছে।",
            "হ্যাঁ, {page_name} পৃষ্ঠা দেখানো হচ্ছে।"
        ]
    ),
    # Extensible architecture: easily pluggable for additional Indic languages
    "hi": LanguageConfig(
        code="hi",
        locale="hi-IN",
        name="Hindi",
        native_name="हिन्दी",
        script="Devanagari",
        tts_voice_hints=["Google हिन्दी", "hi-IN", "Microsoft Swara"],
        default_prompt_greeting="नमस्ते! मैं आपका AI नेविगेशन सहायक हूँ। मैं आपकी क्या मदद कर सकता हूँ?",
        default_unknown_msg="मुझे इस आदेश के लिए कोई पृष्ठ नहीं मिला।",
        nav_ack_templates=[
            "{page_name} पृष्ठ पर जा रहे हैं।",
            "आपके लिए {page_name} खोल रहे हैं।"
        ]
    )
}

def detect_language_heuristic(
    query: str,
    default_lang: str = "en",
    preferred_lang: str = "en",
    page_lang: str = "en"
) -> str:
    """
    Generalized language detector.
    - Accurately detects Bengali script and Devanagari script.
    - Uses active context (user affinity / page language) for Latin script queries,
      leaving semantic and transliteration understanding to the LLM.
    """
    if not query:
        return preferred_lang or page_lang or default_lang

    # 1. Script-based Unicode detection
    if any('\u0980' <= char <= '\u09FF' for char in query):
        return "bn"
    if any('\u0900' <= char <= '\u097F' for char in query):
        return "mr"

    # 2. Contextual fallback: prioritize active page language
    return page_lang or default_lang

def get_language_config(lang_code: str) -> LanguageConfig:
    """Safely retrieves a language configuration, defaulting to English."""
    clean_code = (lang_code or "en").lower().split("-")[0]
    return SUPPORTED_LANGUAGES.get(clean_code, SUPPORTED_LANGUAGES["en"])

def list_supported_languages() -> List[Dict[str, Any]]:
    """Returns list of supported language metadata for UI dropdowns."""
    return [
        {
            "code": cfg.code,
            "locale": cfg.locale,
            "name": cfg.name,
            "native_name": cfg.native_name
        }
        for cfg in SUPPORTED_LANGUAGES.values()
    ]

