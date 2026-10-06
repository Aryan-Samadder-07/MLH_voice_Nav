"use client";

import { AssistantResponse, SupportedLang } from "./assistantTypes";

export class SpeechClient {
  private recognition: any = null;
  private isListening: boolean = false;
  private currentAudio: HTMLAudioElement | null = null;
  private activeUtterance: SpeechSynthesisUtterance | null = null;
  private isSpeaking: boolean = false;
  private silenceTimer: any = null;
  private currentTranscript: string = "";

  constructor() {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        // Enable continuous and interim results for natural, non-rushed speaking window
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.maxAlternatives = 1;
      }
    }
  }

  public isSupported(): boolean {
    return typeof window !== "undefined" && (this.recognition !== null);
  }

  public getIsListening(): boolean {
    return this.isListening;
  }

  public getIsSpeaking(): boolean {
    return this.isSpeaking;
  }

  public listenContinuous(
    langMode: SupportedLang | "auto",
    pageLang: SupportedLang = "en",
    onInterim: (text: string) => void,
    onFinal: (text: string) => void,
    onStatusChange: (isListening: boolean, error?: string) => void
  ): void {
    if (!this.recognition) {
      onStatusChange(false, "Speech Recognition not supported in this browser.");
      return;
    }

    this.stopSpeaking();
    this.stopListening();

    let activeLang = "en-IN";
    if (langMode === "mr") {
      activeLang = "mr-IN";
    } else if (langMode === "bn") {
      activeLang = "bn-IN";
    } else if (langMode === "en") {
      activeLang = "en-IN";
    } else {
      activeLang = pageLang === "mr" ? "mr-IN" : pageLang === "bn" ? "bn-IN" : "en-IN";
    }

    this.recognition.lang = activeLang;
    this.currentTranscript = "";

    const resetSilenceTimer = () => {
      if (this.silenceTimer) {
        clearTimeout(this.silenceTimer);
      }
      // 1200ms of silence after speech before finalizing (natural conversational pause)
      this.silenceTimer = setTimeout(() => {
        if (this.currentTranscript.trim()) {
          const finalCandidate = this.currentTranscript.trim();
          this.stopListening();
          onFinal(finalCandidate);
        }
      }, 1200);
    };

    this.recognition.onstart = () => {
      this.isListening = true;
      onStatusChange(true);
    };

    this.recognition.onresult = (event: any) => {
      let interimAccumulator = "";
      let finalAccumulator = "";

      for (let i = 0; i < event.results.length; i++) {
        const item = event.results[i];
        if (item.isFinal) {
          finalAccumulator += item[0].transcript + " ";
        } else {
          interimAccumulator += item[0].transcript;
        }
      }

      const combined = (finalAccumulator + interimAccumulator).trim();
      if (combined) {
        this.currentTranscript = combined;
        onInterim(combined);
        resetSilenceTimer();
      }
    };

    this.recognition.onerror = (event: any) => {
      if (event.error !== "no-speech" && event.error !== "aborted") {
        onStatusChange(false, event.error);
      }
    };

    this.recognition.onend = () => {
      if (this.silenceTimer) {
        clearTimeout(this.silenceTimer);
      }
      this.isListening = false;
      onStatusChange(false);
      
      // If recognition ended naturally and we have a transcript that wasn't finalized yet
      if (this.currentTranscript.trim()) {
        const candidate = this.currentTranscript.trim();
        this.currentTranscript = "";
        onFinal(candidate);
      }
    };

    try {
      this.recognition.start();
    } catch (err: any) {
      this.isListening = false;
      onStatusChange(false, err.message);
    }
  }

  public stopListening(): void {
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (e) {}
      this.isListening = false;
    }
  }

  public stopSpeaking(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.src = "";
      this.currentAudio = null;
    }
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    this.activeUtterance = null;
    this.isSpeaking = false;
  }

  public speak(
    text: string,
    lang: SupportedLang | string = "en",
    audioBase64?: string | null
  ): Promise<void> {
    return new Promise((resolve) => {
      if (typeof window === "undefined" || !text) {
        resolve();
        return;
      }

      this.stopListening();
      this.stopSpeaking();
      this.isSpeaking = true;

      if (audioBase64) {
        try {
          const audio = new Audio(`data:audio/mp3;base64,${audioBase64}`);
          this.currentAudio = audio;
          audio.onended = () => {
            this.currentAudio = null;
            this.isSpeaking = false;
            resolve();
          };
          audio.onerror = () => {
            this.fallbackBrowserTTS(text, lang, resolve);
          };
          audio.play().catch(() => {
            this.fallbackBrowserTTS(text, lang, resolve);
          });
          return;
        } catch (e) {
          this.fallbackBrowserTTS(text, lang, resolve);
          return;
        }
      }

      this.fallbackBrowserTTS(text, lang, resolve);
    });
  }

  private fallbackBrowserTTS(text: string, lang: string, resolve: () => void) {
    if (!window.speechSynthesis) {
      this.isSpeaking = false;
      resolve();
      return;
    }

    window.speechSynthesis.cancel();

    const cleanText = text.replace(/[*_#`~[\]()]/g, "").trim();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    this.activeUtterance = utterance;

    if (lang === "mr" || lang.startsWith("mr")) {
      utterance.lang = "mr-IN";
    } else if (lang === "bn" || lang.startsWith("bn")) {
      utterance.lang = "bn-IN";
    } else {
      utterance.lang = "en-IN";
    }
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    let isDone = false;
    const finish = () => {
      if (!isDone) {
        isDone = true;
        this.activeUtterance = null;
        this.isSpeaking = false;
        resolve();
      }
    };

    utterance.onend = finish;
    utterance.onerror = finish;

    const resumeTimer = setInterval(() => {
      if (!window.speechSynthesis.speaking) {
        clearInterval(resumeTimer);
      } else {
        window.speechSynthesis.pause();
        window.speechSynthesis.resume();
      }
    }, 4000);

    utterance.onend = () => {
      clearInterval(resumeTimer);
      finish();
    };

    window.speechSynthesis.speak(utterance);
  }

  public async sendCommandToBackend(
    query: string,
    langMode: SupportedLang | "auto" = "auto",
    currentPath: string = "/",
    preferredLang: string = "en",
    pageLang: string = "en",
    formContext?: Record<string, any>,
    conversationHistory?: Array<{ role: string; text: string }>,
    userContext?: { isLoggedIn: boolean; role?: string; name?: string }
  ): Promise<{ result: AssistantResponse; tts?: { audio_base64?: string } }> {
    const payload = {
      query,
      language_mode: langMode,
      preferred_lang: preferredLang,
      page_lang: pageLang,
      current_path: currentPath,
      form_context: formContext || null,
      conversation_history: conversationHistory || [],
      user_context: userContext || { isLoggedIn: false }
    };

    const res = await fetch("/api/assistant/command", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      throw new Error(`API returned status ${res.status}`);
    }

    const data = await res.json();
    return {
      result: data,
      tts: data.tts || null
    };
  }
}

export const speechClient = new SpeechClient();
