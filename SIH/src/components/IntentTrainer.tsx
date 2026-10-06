"use client";

import React, { useState, useEffect } from "react";
import { RouteCatalogItem, SupportedLang } from "../lib/assistantTypes";

interface IntentTrainerProps {
  currentLang?: SupportedLang;
  onClose: () => void;
}

export const IntentTrainer: React.FC<IntentTrainerProps> = ({
  currentLang = "en",
  onClose
}) => {
  const [routes, setRoutes] = useState<RouteCatalogItem[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<string>("");
  const [phrase, setPhrase] = useState<string>("");
  const [lang, setLang] = useState<SupportedLang>(currentLang);
  const [loading, setLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchRoutes();
  }, []);

  const fetchRoutes = async () => {
    try {
      const res = await fetch("/api/assistant/intents");
      if (res.ok) {
        const data = await res.json();
        setRoutes(data.routes || []);
        if (data.routes?.length > 0) {
          setSelectedRoute(data.routes[0].route_id);
        }
      }
    } catch (e) {}
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phrase.trim() || !selectedRoute) return;

    setLoading(true);
    setStatusMessage(null);

    try {
      const res = await fetch("/api/assistant/intents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          route_id: selectedRoute,
          utterance: phrase.trim(),
          language_code: lang
        })
      });

      if (res.ok) {
        setStatusMessage({ type: "success", text: "Successfully trained new voice command!" });
        setPhrase("");
        fetchRoutes();
      } else {
        setStatusMessage({ type: "error", text: "Failed to train utterance." });
      }
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "Network error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      background: "#0f172a",
      borderRadius: "16px",
      border: "1px solid rgba(255, 255, 255, 0.12)",
      boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
      color: "#f8fafc",
      padding: "24px",
      position: "relative"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "700", display: "flex", alignItems: "center", gap: "8px" }}>
          <span>🎓</span> Train Voice Navigation
        </h3>
        <button
          onClick={onClose}
          style={{
            background: "rgba(255, 255, 255, 0.1)",
            border: "none",
            color: "#94a3b8",
            borderRadius: "50%",
            width: "28px",
            height: "28px",
            cursor: "pointer"
          }}
        >
          ✕
        </button>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        <div>
          <label style={{ display: "block", fontSize: "0.8rem", color: "#94a3b8", marginBottom: "6px" }}>Target Page</label>
          <select
            value={selectedRoute}
            onChange={(e) => setSelectedRoute(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 12px",
              background: "#1e293b",
              border: "1px solid #334155",
              borderRadius: "8px",
              color: "#f8fafc",
              fontSize: "0.85rem"
            }}
          >
            {routes.map((r) => (
              <option key={r.route_id} value={r.route_id}>
                {r.name_en} ({r.path})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: "block", fontSize: "0.8rem", color: "#94a3b8", marginBottom: "6px" }}>Spoken Phrase</label>
          <input
            type="text"
            value={phrase}
            onChange={(e) => setPhrase(e.target.value)}
            placeholder="e.g. 'শস্য বিক্রি করো' or 'open mandi'"
            style={{
              width: "100%",
              padding: "8px 12px",
              background: "#1e293b",
              border: "1px solid #334155",
              borderRadius: "8px",
              color: "#f8fafc",
              fontSize: "0.85rem"
            }}
          />
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          {(["en", "mr", "bn"] as SupportedLang[]).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLang(l)}
              style={{
                flex: 1,
                padding: "6px",
                borderRadius: "6px",
                border: "none",
                fontSize: "0.8rem",
                fontWeight: "700",
                cursor: "pointer",
                background: lang === l ? "#059669" : "#1e293b",
                color: "#f8fafc"
              }}
            >
              {l === "en" ? "English" : l === "mr" ? "मराठी" : "বাংলা"}
            </button>
          ))}
        </div>

        <button
          type="submit"
          disabled={loading || !phrase.trim()}
          style={{
            background: "#059669",
            color: "#ffffff",
            border: "none",
            padding: "10px",
            borderRadius: "8px",
            fontWeight: "700",
            cursor: loading || !phrase.trim() ? "not-allowed" : "pointer"
          }}
        >
          {loading ? "Training..." : "Save Custom Phrase"}
        </button>

        {statusMessage && (
          <div style={{
            fontSize: "0.8rem",
            color: statusMessage.type === "success" ? "#34d399" : "#f87171",
            textAlign: "center"
          }}>
            {statusMessage.text}
          </div>
        )}
      </form>
    </div>
  );
};
