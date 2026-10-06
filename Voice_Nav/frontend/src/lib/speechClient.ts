import { ApiResponse, SupportedLang } from "./types";

const rawApiUrl = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api").trim().replace(/\/+$/, "");
export const API_BASE_URL = rawApiUrl.endsWith("/api") ? rawApiUrl : `${rawApiUrl}/api`;

// Speech Recognition Type Definitions
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export class SpeechClient {
  private recognition: any = null;
  private isListening: boolean = false;
  private currentLang: SupportedLang = "en";
  private onTranscriptCallback?: (transcript: string, isFinal: boolean) => void;
  private onStatusChangeCallback?: (isListening: boolean, error?: string) => void;

  constructor() {
    if (typeof window !== "undefined") {
      const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognitionClass) {
        this.recognition = new SpeechRecognitionClass();
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
        this.recognition.maxAlternatives = 1;

        this.recognition.onstart = () => {
          this.isListening = true;
          this.onStatusChangeCallback?.(true);
        };

        this.recognition.onresult = (event: any) => {
          let interimTranscript = "";
          let finalTranscript = "";

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            } else {
              interimTranscript += transcript;
            }
          }

          if (finalTranscript) {
            this.onTranscriptCallback?.(finalTranscript, true);
          } else if (interimTranscript) {
            this.onTranscriptCallback?.(interimTranscript, false);
          }
        };

        this.recognition.onerror = (event: any) => {
          console.warn("Speech recognition event error:", event.error);
          this.isListening = false;
          this.onStatusChangeCallback?.(false, event.error);
        };

        this.recognition.onend = () => {
          this.isListening = false;
          this.onStatusChangeCallback?.(false);
        };
      }
    }
  }

  public isSupported(): boolean {
    if (typeof window === "undefined") return false;
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  private currentLang: LanguageMode = "auto";
  private activeRecognitionLang: string = "en-IN";

  public setLanguage(lang: LanguageMode, preferredLang: SupportedLang = "en", pageLang: SupportedLang = "en") {
    this.currentLang = lang;
    
    if (lang === "bn") {
      this.activeRecognitionLang = "bn-IN";
    } else if (lang === "mr") {
      this.activeRecognitionLang = "mr-IN";
    } else if (lang === "en") {
      this.activeRecognitionLang = "en-IN";
    } else {
      // Auto Mode: Prioritize Active Page Language for pure Indic speech recognition
      if (pageLang === "bn") {
        this.activeRecognitionLang = "bn-IN";
      } else if (pageLang === "mr") {
        this.activeRecognitionLang = "mr-IN";
      } else {
        this.activeRecognitionLang = "en-IN";
      }
    }

    if (this.recognition) {
      this.recognition.lang = this.activeRecognitionLang;
    }
  }

  public startListening(
    onTranscript: (transcript: string, isFinal: boolean) => void,
    onStatusChange: (isListening: boolean, error?: string) => void
  ) {
    this.onTranscriptCallback = onTranscript;
    this.onStatusChangeCallback = onStatusChange;

    if (!this.recognition) {
      onStatusChange(false, "Speech recognition not supported in this browser.");
      return;
    }

    try {
      // Always enforce the current active recognition language right before starting
      this.recognition.lang = this.activeRecognitionLang || "en-IN";
      this.recognition.start();
    } catch (err: any) {
      console.warn("Failed to start speech recognition:", err);
      onStatusChange(false, err?.message || "Recognition start error");
    }
  }

  public stopListening() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (err) {
        console.warn("Error stopping recognition:", err);
      }
    }
    this.isListening = false;
    this.onStatusChangeCallback?.(false);
  }

  public async sendCommandToBackend(
    text: string,
    langMode: LanguageMode,
    currentPath: string,
    preferredLang: string = "en",
    pageLang: string = "en",
    formContext?: any,
    conversationHistory?: Array<{ role: string; text: string }>
  ): Promise<ApiResponse> {
    const res = await fetch(`${API_BASE_URL}/assistant/process`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        language: langMode,
        preferred_language: preferredLang,
        page_language: pageLang,
        current_path: currentPath,
        form_context: formContext,
        conversation_history: conversationHistory || []
      })
    });

    if (!res.ok) {
      throw new Error(`Server error: ${res.statusText}`);
    }

    return await res.json();
  }

  private isSpeaking: boolean = false;
  private onSpeakingChangeCallback?: (isSpeaking: boolean) => void;

  public setSpeakingCallback(callback: (isSpeaking: boolean) => void) {
    this.onSpeakingChangeCallback = callback;
  }

  public getIsSpeaking(): boolean {
    return this.isSpeaking;
  }

  /**
   * Cleans text to ensure natural, smooth TTS without stuttering on markdown/symbols.
   */
  private cleanTextForSpeech(raw: string): string {
    return raw
      .replace(/[*_#>`~[\]()]/g, " ") // Remove markdown symbols
      .replace(/\s+/g, " ")            // Collapse multiple spaces
      .trim();
  }

  public speak(text: string, lang: SupportedLang, audioBase64?: string | null) {
    if (typeof window === "undefined" || !text) return;

    // Stop listening immediately when assistant speaks to prevent mic feedback loop
    this.stopListening();

    const notifySpeaking = (speaking: boolean) => {
      this.isSpeaking = speaking;
      this.onSpeakingChangeCallback?.(speaking);
    };

    // 1. If backend provided base64 audio (e.g. Cloud TTS)
    if (audioBase64) {
      try {
        const audio = new Audio(`data:audio/wav;base64,${audioBase64}`);
        notifySpeaking(true);
        audio.onended = () => notifySpeaking(false);
        audio.onerror = () => notifySpeaking(false);
        audio.play().catch(e => {
          console.warn("Audio element play error:", e);
          notifySpeaking(false);
        });
        return;
      } catch (err) {
        console.warn("Audio playback error:", err);
        notifySpeaking(false);
      }
    }

    // 2. Web Speech API SpeechSynthesis (Optimized for smooth, natural voice)
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel(); // Stop any pending speech

      const cleanText = this.cleanTextForSpeech(text);
      if (!cleanText) return;

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 0.95; // Natural relaxed pace
      utterance.pitch = 1.0;
      utterance.lang = lang === "bn" ? "bn-IN" : lang === "mr" ? "mr-IN" : "en-IN";

      utterance.onstart = () => notifySpeaking(true);
      utterance.onend = () => notifySpeaking(false);
      utterance.onerror = () => notifySpeaking(false);

      // Select highest quality natural voice
      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        if (lang === "bn") {
          const bengaliVoice = voices.find(
            v => v.lang.startsWith("bn") || v.name.toLowerCase().includes("bengali") || v.name.includes("বাংলা") || v.name.includes("Tanishaa")
          );
          if (bengaliVoice) utterance.voice = bengaliVoice;
        } else if (lang === "mr") {
          const marathiVoice = voices.find(
            v => v.lang.startsWith("mr") || v.name.toLowerCase().includes("marathi") || v.name.includes("मराठी")
          ) || voices.find(v => v.lang.startsWith("hi"));
          if (marathiVoice) utterance.voice = marathiVoice;
        } else {
          const naturalEnglish = voices.find(
            v => (v.name.includes("Natural") || v.name.includes("Google") || v.name.includes("Heera") || v.name.includes("Ravi")) && v.lang.startsWith("en")
          ) || voices.find(v => v.lang.startsWith("en"));
          if (naturalEnglish) utterance.voice = naturalEnglish;
        }
      }

      notifySpeaking(true);
      window.speechSynthesis.speak(utterance);
    }
  }
}

export const speechClient = new SpeechClient();
