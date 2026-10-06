"use client";

import React from "react";
import { useLanguage } from "../../context/LanguageContext";

export default function SettingsPage() {
  const { pageLanguage, setPageLanguage, userAffinity, preferredLanguage } = useLanguage();

  const totalInteractions = userAffinity.en + userAffinity.mr + userAffinity.bn;
  const mrPercent = totalInteractions > 0 ? Math.round((userAffinity.mr / totalInteractions) * 100) : 33;
  const bnPercent = totalInteractions > 0 ? Math.round((userAffinity.bn / totalInteractions) * 100) : 33;
  const enPercent = totalInteractions > 0 ? Math.round((userAffinity.en / totalInteractions) * 100) : 34;

  return (
    <div className="page-container">
      <div style={{ marginBottom: "28px" }}>
        <div style={{ display: "inline-block", background: "#e0e7ff", color: "#3730a3", padding: "4px 12px", borderRadius: "16px", fontSize: "0.8rem", fontWeight: "700", marginBottom: "8px" }}>
          ⚙️ Preferences & Configuration
        </div>
        <h1 style={{ fontSize: "2rem", fontWeight: "800", color: "#0f172a" }}>
          Settings
        </h1>
        <p style={{ color: "#64748b", fontSize: "0.95rem" }}>
          Configuration page for Voice STT/TTS settings, Multilingual UI, and Adaptive Language Learning.
        </p>
      </div>

      <div className="grid-2">
        {/* Multilingual & Adaptive Preference Card */}
        <div className="card">
          <h2 style={{ fontSize: "1.1rem", fontWeight: "700", marginBottom: "16px", color: "#1e293b" }}>
            🌐 Multilingual & Adaptive Language Learning
          </h2>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", fontSize: "0.88rem" }}>
            <div>
              <label style={{ display: "block", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                Active Page Language
              </label>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={() => setPageLanguage("en")}
                  style={{
                    flex: 1,
                    minWidth: "90px",
                    padding: "8px 14px",
                    borderRadius: "8px",
                    border: pageLanguage === "en" ? "2px solid #2563eb" : "1px solid #cbd5e1",
                    background: pageLanguage === "en" ? "#eff6ff" : "#ffffff",
                    fontWeight: "700",
                    color: pageLanguage === "en" ? "#1e40af" : "#475569",
                    cursor: "pointer"
                  }}
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => setPageLanguage("mr")}
                  style={{
                    flex: 1,
                    minWidth: "90px",
                    padding: "8px 14px",
                    borderRadius: "8px",
                    border: pageLanguage === "mr" ? "2px solid #2563eb" : "1px solid #cbd5e1",
                    background: pageLanguage === "mr" ? "#eff6ff" : "#ffffff",
                    fontWeight: "700",
                    color: pageLanguage === "mr" ? "#1e40af" : "#475569",
                    cursor: "pointer"
                  }}
                >
                  मराठी
                </button>
                <button
                  type="button"
                  onClick={() => setPageLanguage("bn")}
                  style={{
                    flex: 1,
                    minWidth: "90px",
                    padding: "8px 14px",
                    borderRadius: "8px",
                    border: pageLanguage === "bn" ? "2px solid #2563eb" : "1px solid #cbd5e1",
                    background: pageLanguage === "bn" ? "#eff6ff" : "#ffffff",
                    fontWeight: "700",
                    color: pageLanguage === "bn" ? "#1e40af" : "#475569",
                    cursor: "pointer"
                  }}
                >
                  বাংলা
                </button>
              </div>
            </div>

            {/* Adaptive Affinity Stats */}
            <div style={{ background: "#f8fafc", padding: "14px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <span style={{ fontWeight: "700", color: "#0f172a" }}>🧠 AI Learned Language Preference:</span>
                <span className="badge" style={{ background: "#dbeafe", color: "#1e40af", fontWeight: "700" }}>
                  {preferredLanguage.toUpperCase()}
                </span>
              </div>
              <div style={{ fontSize: "0.82rem", color: "#64748b", marginBottom: "8px" }}>
                The AI automatically biases ambiguous keywords to match your historical usage.
              </div>

              {/* Progress bar */}
              <div style={{ height: "10px", width: "100%", background: "#e2e8f0", borderRadius: "6px", overflow: "hidden", display: "flex" }}>
                <div style={{ width: `${enPercent}%`, background: "#3b82f6" }} title={`English: ${userAffinity.en} queries (${enPercent}%)`} />
                <div style={{ width: `${mrPercent}%`, background: "#a855f7" }} title={`Marathi: ${userAffinity.mr} queries (${mrPercent}%)`} />
                <div style={{ width: `${bnPercent}%`, background: "#10b981" }} title={`Bengali: ${userAffinity.bn} queries (${bnPercent}%)`} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "#64748b", marginTop: "4px" }}>
                <span>English: {userAffinity.en} ({enPercent}%)</span>
                <span>मराठी: {userAffinity.mr} ({mrPercent}%)</span>
                <span>বাংলা: {userAffinity.bn} ({bnPercent}%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Speech Engine Configuration */}
        <div className="card">
          <h2 style={{ fontSize: "1.1rem", fontWeight: "700", marginBottom: "16px", color: "#1e293b" }}>
            🎙️ Speech & Voice Engine Configuration
          </h2>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", fontSize: "0.88rem" }}>
            <div>
              <label style={{ display: "block", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                Primary STT Engine
              </label>
              <select defaultValue="groq" style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", background: "#f8fafc" }}>
                <option value="groq">Groq Cloud Whisper API (whisper-large-v3) [Default AI Cloud Engine]</option>
                <option value="browser">Browser Web Speech API (Local Fallback)</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                Primary TTS Engine
              </label>
              <select defaultValue="cloud" style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", background: "#f8fafc" }}>
                <option value="cloud">Groq / Cloud Indic Neural TTS [Default AI Cloud Engine]</option>
                <option value="browser">Browser SpeechSynthesis (Local Fallback)</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
