"use client";

import React, { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { speechClient } from "../lib/speechClient";
import { AssistantResponse, SupportedLang } from "../lib/assistantTypes";
import { useLanguage } from "../context/LanguageContext";
import { useUser } from "../context/UserContext";
import { IntentTrainer } from "./IntentTrainer";

export const VoiceAssistant: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { pageLanguage, setPageLanguage, recordLanguageUsage, preferredLanguage, t } = useLanguage();
  const { logout, currentUser } = useUser();

  const [languageMode, setLanguageMode] = useState<SupportedLang | "auto">("auto");
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>("");
  const [lastResult, setLastResult] = useState<AssistantResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [manualText, setManualText] = useState<string>("");
  const [showTrainer, setShowTrainer] = useState<boolean>(false);
  const [audioFeedback, setAudioFeedback] = useState<boolean>(true);

  const isProcessingRef = useRef<boolean>(false);
  const isSpeakingRef = useRef<boolean>(false);
  const activeFormStateRef = useRef<Record<string, any>>({});
  const conversationHistoryRef = useRef<Array<{ role: string; text: string }>>([]);

  // Reset lingering form state and conversation history when pathname changes or user logs in/out
  useEffect(() => {
    activeFormStateRef.current = {};
    conversationHistoryRef.current = [];
  }, [pathname, currentUser?.id]);

  useEffect(() => {
    const handleFormState = (e: any) => {
      activeFormStateRef.current = e.detail || {};
    };
    const handleFormCleared = () => {
      activeFormStateRef.current = {};
      conversationHistoryRef.current = [];
    };
    window.addEventListener("custom:form_state_changed", handleFormState);
    window.addEventListener("custom:form_state_cleared", handleFormCleared);
    return () => {
      window.removeEventListener("custom:form_state_changed", handleFormState);
      window.removeEventListener("custom:form_state_cleared", handleFormCleared);
    };
  }, []);

  useEffect(() => {
    return () => {
      speechClient.stopSpeaking();
      speechClient.stopListening();
    };
  }, []);

  const handleToggleListening = () => {
    if (isSpeakingRef.current) {
      speechClient.stopSpeaking();
      isSpeakingRef.current = false;
      setIsSpeaking(false);
    }

    if (isListening) {
      speechClient.stopListening();
      setIsListening(false);
    } else {
      if (isProcessingRef.current) return;

      setErrorMessage(null);
      setTranscript("");

      speechClient.listenContinuous(
        languageMode,
        pageLanguage,
        (interimText) => {
          setTranscript(interimText);
        },
        (finalText) => {
          setTranscript(finalText);
          if (finalText && !isProcessingRef.current) {
            handleProcessCommand(finalText);
          }
        },
        (listening, error) => {
          setIsListening(listening);
          if (error) {
            setErrorMessage(`Mic Error: ${error}`);
          }
        }
      );
    }
  };

  const handleProcessCommand = async (commandText: string) => {
    const cleanCmd = commandText.trim();
    if (!cleanCmd || isProcessingRef.current) return;

    isProcessingRef.current = true;
    setIsProcessing(true);
    setErrorMessage(null);

    speechClient.stopListening();
    setIsListening(false);

    const updatedHistory = [...conversationHistoryRef.current, { role: "user", text: cleanCmd }];
    conversationHistoryRef.current = updatedHistory.slice(-10);

    try {
      const response = await speechClient.sendCommandToBackend(
        cleanCmd,
        languageMode,
        pathname,
        preferredLanguage,
        pageLanguage,
        activeFormStateRef.current,
        conversationHistoryRef.current,
        {
          isLoggedIn: !!currentUser,
          role: currentUser?.role,
          name: currentUser?.name
        }
      );
      const res = response.result;
      setLastResult(res);

      if (res.response_text) {
        conversationHistoryRef.current = [
          ...conversationHistoryRef.current,
          { role: "assistant", text: res.response_text }
        ].slice(-10);
      }

      const detectedLang = (res.detected_language || res.language || "en") as SupportedLang;
      recordLanguageUsage(detectedLang);

      // Perform Logout
      if (res.action === "LOGOUT" || res.intent === "LOGOUT") {
        logout();
        router.push("/");
      } else if (res.action === "SEND_OTP" || res.intent === "SEND_OTP") {
        window.dispatchEvent(new CustomEvent("custom:send_otp", { detail: { otp: res.otp } }));
      } else if (res.action === "CHANGE_LANGUAGE" || res.intent === "CHANGE_LANGUAGE") {
        const targetLang = (res.target_language || "en") as SupportedLang;
        setPageLanguage(targetLang);
        setLanguageMode(targetLang);
      } else if (res.action === "FILL_FORM" || res.intent === "FILL_FORM") {
        // If user is already logged in, do not redirect to login/signup forms
        if (!currentUser) {
          const targetPage = res.target_path === "/login" || pathname === "/login" ? "/login" : "/signup";
          if (pathname !== targetPage) {
            router.push(targetPage);
          }
          setTimeout(() => {
            window.dispatchEvent(
              new CustomEvent("custom:form_update", { detail: res.form_data || {} })
            );
          }, pathname !== targetPage ? 400 : 50);
        }
      } else if (res.action === "SUBMIT_FORM" || res.intent === "SUBMIT_FORM") {
        if (!currentUser) {
          const targetPage = res.target_path === "/login" || pathname === "/login" ? "/login" : "/signup";
          if (pathname !== targetPage) {
            router.push(targetPage);
          }
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent("custom:form_submit"));
          }, pathname !== targetPage ? 400 : 50);
        }
      } else if (res.action === "CLEAR_FORM" || res.intent === "CLEAR_FORM") {
        window.dispatchEvent(new CustomEvent("custom:form_clear"));
      } else if (res.intent === "NAVIGATE" && res.target_path) {
        const destPath = res.target_path;
        const targetTab = res.target_tab;

        if (pathname === destPath && targetTab) {
          window.dispatchEvent(new CustomEvent("custom:switch_tab", { detail: { tab: targetTab } }));
        } else {
          const finalUrl = targetTab ? `${destPath}?tab=${targetTab}` : destPath;
          router.push(finalUrl);
          if (targetTab) {
            setTimeout(() => {
              window.dispatchEvent(new CustomEvent("custom:switch_tab", { detail: { tab: targetTab } }));
            }, 350);
          }
        }
      }

      if (audioFeedback && res.response_text) {
        isSpeakingRef.current = true;
        setIsSpeaking(true);
        await speechClient.speak(res.response_text, detectedLang, response.tts?.audio_base64);
        isSpeakingRef.current = false;
        setIsSpeaking(false);
      }
    } catch (err: any) {
      console.error("Assistant command processing error:", err);
      setErrorMessage("Failed to process command. Make sure the API is reachable.");
    } finally {
      isProcessingRef.current = false;
      setIsProcessing(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualText.trim() || isProcessingRef.current) return;
    const text = manualText.trim();
    setTranscript(text);
    setManualText("");
    handleProcessCommand(text);
  };

  return (
    <>
      {showTrainer && (
        <div style={{
          position: "fixed",
          bottom: "140px",
          right: "24px",
          width: "480px",
          maxWidth: "calc(100vw - 48px)",
          zIndex: 9999
        }}>
          <IntentTrainer
            currentLang={languageMode === "bn" ? "bn" : languageMode === "mr" ? "mr" : "en"}
            onClose={() => setShowTrainer(false)}
          />
        </div>
      )}

      <aside
        aria-label="AI Voice Assistant"
        style={{
          position: "fixed",
          bottom: "16px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "92%",
          maxWidth: "980px",
          background: "#0f172a",
          borderRadius: "16px",
          boxShadow: "0 20px 30px -10px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)",
          color: "#f8fafc",
          padding: "14px 20px",
          zIndex: 9990,
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          backdropFilter: "blur(8px)"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "rgba(255, 255, 255, 0.08)",
              padding: "4px 10px",
              borderRadius: "20px"
            }}>
              <span style={{
                display: "inline-block",
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: isSpeaking ? "#a855f7" : isListening ? "#ef4444" : isProcessing ? "#eab308" : "#10b981",
                boxShadow: isSpeaking ? "0 0 8px #a855f7" : isListening ? "0 0 8px #ef4444" : "none"
              }} />
              <span style={{ fontSize: "0.85rem", fontWeight: "700", letterSpacing: "0.5px" }}>
                {isSpeaking ? t("speaking_label") : isProcessing ? t("thinking_label") : isListening ? "🎙️ Listening..." : t("ai_assistant_label")}
              </span>
            </div>

            <div style={{ display: "flex", background: "rgba(255, 255, 255, 0.08)", borderRadius: "8px", padding: "2px" }}>
              <button
                type="button"
                onClick={() => setLanguageMode("auto")}
                style={{
                  background: languageMode === "auto" ? "#059669" : "transparent",
                  color: "#ffffff",
                  border: "none",
                  padding: "4px 10px",
                  borderRadius: "6px",
                  fontSize: "0.78rem",
                  fontWeight: "700",
                  cursor: "pointer"
                }}
              >
                🌐 Auto
              </button>
              <button
                type="button"
                onClick={() => setLanguageMode("en")}
                style={{
                  background: languageMode === "en" ? "#059669" : "transparent",
                  color: "#ffffff",
                  border: "none",
                  padding: "4px 10px",
                  borderRadius: "6px",
                  fontSize: "0.78rem",
                  fontWeight: "700",
                  cursor: "pointer"
                }}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLanguageMode("mr")}
                style={{
                  background: languageMode === "mr" ? "#059669" : "transparent",
                  color: "#ffffff",
                  border: "none",
                  padding: "4px 10px",
                  borderRadius: "6px",
                  fontSize: "0.78rem",
                  fontWeight: "700",
                  cursor: "pointer"
                }}
              >
                मराठी
              </button>
              <button
                type="button"
                onClick={() => setLanguageMode("bn")}
                style={{
                  background: languageMode === "bn" ? "#059669" : "transparent",
                  color: "#ffffff",
                  border: "none",
                  padding: "4px 10px",
                  borderRadius: "6px",
                  fontSize: "0.78rem",
                  fontWeight: "700",
                  cursor: "pointer"
                }}
              >
                বাংলা
              </button>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              type="button"
              onClick={handleToggleListening}
              style={{
                background: isListening ? "#ef4444" : "#059669",
                color: "#ffffff",
                border: "none",
                padding: "8px 16px",
                borderRadius: "20px",
                fontWeight: "700",
                fontSize: "0.85rem",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                cursor: "pointer",
                boxShadow: isListening ? "0 0 12px rgba(239, 68, 68, 0.6)" : "none"
              }}
            >
              {isListening ? "🛑 Stop Speaking" : "🎙️ Speak"}
            </button>

            <form onSubmit={handleManualSubmit} style={{ display: "flex", gap: "6px" }}>
              <input
                type="text"
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                placeholder="Type voice command..."
                style={{
                  background: "rgba(255, 255, 255, 0.08)",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  borderRadius: "8px",
                  padding: "6px 12px",
                  color: "#f8fafc",
                  fontSize: "0.85rem",
                  width: "190px"
                }}
              />
              <button
                type="submit"
                disabled={isProcessing}
                style={{
                  background: "rgba(255, 255, 255, 0.15)",
                  color: "#ffffff",
                  border: "none",
                  padding: "6px 12px",
                  borderRadius: "8px",
                  fontSize: "0.8rem",
                  cursor: isProcessing ? "not-allowed" : "pointer"
                }}
              >
                Send
              </button>
            </form>

            <button
              type="button"
              onClick={() => setShowTrainer(!showTrainer)}
              style={{
                background: "rgba(255, 255, 255, 0.08)",
                color: "#94a3b8",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                padding: "6px 10px",
                borderRadius: "8px",
                fontSize: "0.8rem",
                cursor: "pointer"
              }}
            >
              🎓 Train
            </button>

            <button
              type="button"
              onClick={() => {
                const next = !audioFeedback;
                setAudioFeedback(next);
                if (!next) speechClient.stopSpeaking();
              }}
              style={{
                background: "transparent",
                border: "none",
                fontSize: "1.1rem",
                cursor: "pointer",
                opacity: audioFeedback ? 1 : 0.4
              }}
              title={audioFeedback ? "Audio feedback on" : "Audio feedback muted"}
            >
              {audioFeedback ? "🔊" : "🔇"}
            </button>
          </div>
        </div>

        {(transcript || lastResult || errorMessage) && (
          <div style={{
            background: "rgba(0, 0, 0, 0.3)",
            padding: "8px 12px",
            borderRadius: "8px",
            fontSize: "0.82rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "8px"
          }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              {transcript && (
                <div>
                  <span style={{ color: "#94a3b8" }}>Speech:</span>{" "}
                  <span style={{ color: "#38bdf8", fontWeight: "600" }}>{transcript}</span>
                  {isListening && <span className="animate-pulse" style={{ color: "#38bdf8" }}> ...</span>}
                </div>
              )}
              {lastResult?.response_text && !isListening && (
                <div><span style={{ color: "#a855f7" }}>Assistant:</span> <span>{lastResult.response_text}</span></div>
              )}
              {errorMessage && <div style={{ color: "#f87171" }}>{errorMessage}</div>}
            </div>

            {lastResult && (
              <div style={{ display: "flex", gap: "8px", alignItems: "center", fontSize: "0.72rem", color: "#94a3b8" }}>
                <span style={{ background: "rgba(255, 255, 255, 0.1)", padding: "2px 6px", borderRadius: "4px" }}>
                  🌐 {lastResult.detected_language?.toUpperCase()}
                </span>
                {lastResult.latency_ms && (
                  <span style={{ background: "rgba(255, 255, 255, 0.1)", padding: "2px 6px", borderRadius: "4px" }}>
                    ⚡ {lastResult.latency_ms}ms
                  </span>
                )}
                {lastResult.confidence && (
                  <span style={{ background: "rgba(255, 255, 255, 0.1)", padding: "2px 6px", borderRadius: "4px" }}>
                    Conf: {Math.round(lastResult.confidence * 100)}%
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </aside>
    </>
  );
};
