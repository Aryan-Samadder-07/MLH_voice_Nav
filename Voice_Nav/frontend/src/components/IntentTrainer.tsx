"use client";

import React, { useState, useEffect } from "react";
import { RouteMetadata, SupportedLang } from "../lib/types";
import { API_BASE_URL } from "../lib/speechClient";

interface IntentTrainerProps {
  currentLang: SupportedLang;
  onClose?: () => void;
}

export const IntentTrainer: React.FC<IntentTrainerProps> = ({ currentLang, onClose }) => {
  const [routes, setRoutes] = useState<RouteMetadata[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<string>("home");
  const [newUtterance, setNewUtterance] = useState<string>("");
  const [trainLang, setTrainLang] = useState<SupportedLang>(currentLang);
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchRoutes = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/assistant/routes`);
      if (res.ok) {
        const data = await res.json();
        setRoutes(data.routes || []);
      }
    } catch (err) {
      console.warn("Could not fetch training routes:", err);
    }
  };

  useEffect(() => {
    fetchRoutes();
  }, []);

  const handleTrain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUtterance.trim()) return;

    setLoading(true);
    setStatusMsg(null);

    try {
      const res = await fetch(`${API_BASE_URL}/assistant/train`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          route_id: selectedRoute,
          utterance: newUtterance.trim(),
          language: trainLang
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setStatusMsg({ text: data.message || "Trained successfully!", type: "success" });
        setNewUtterance("");
        await fetchRoutes();
      } else {
        setStatusMsg({ text: data.detail || data.message || "Failed to train phrase.", type: "error" });
      }
    } catch (err: any) {
      setStatusMsg({ text: "Could not reach backend API server.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const activeRouteData = routes.find(r => r.route_id === selectedRoute);

  return (
    <div style={{
      background: "#ffffff",
      borderRadius: "12px",
      border: "1px solid #e2e8f0",
      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
      padding: "20px",
      color: "#0f172a"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <div>
          <h3 style={{ fontSize: "1.1rem", fontWeight: "700", margin: 0, color: "#1e293b" }}>
            🎓 Train Voice Navigation AI
          </h3>
          <p style={{ fontSize: "0.85rem", color: "#64748b", margin: "4px 0 0 0" }}>
            Add custom Marathi or English voice phrases to teach the assistant new routing commands.
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            style={{
              border: "none",
              background: "#f1f5f9",
              borderRadius: "6px",
              padding: "4px 10px",
              cursor: "pointer",
              fontWeight: "600",
              color: "#475569"
            }}
          >
            ✕
          </button>
        )}
      </div>

      <form onSubmit={handleTrain} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <div>
            <label style={{ fontSize: "0.8rem", fontWeight: "600", color: "#475569", display: "block", marginBottom: "4px" }}>
              Target Page / Route
            </label>
            <select
              value={selectedRoute}
              onChange={(e) => setSelectedRoute(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: "6px",
                border: "1px solid #cbd5e1",
                fontSize: "0.9rem",
                background: "#f8fafc"
              }}
            >
              {routes.map((r) => (
                <option key={r.route_id} value={r.route_id}>
                  {trainLang === "bn" ? r.name_bn || r.name_en : trainLang === "mr" ? r.name_mr : r.name_en} - {r.path}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: "0.8rem", fontWeight: "600", color: "#475569", display: "block", marginBottom: "4px" }}>
              Language of Phrase
            </label>
            <select
              value={trainLang}
              onChange={(e) => setTrainLang(e.target.value as SupportedLang)}
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: "6px",
                border: "1px solid #cbd5e1",
                fontSize: "0.9rem",
                background: "#f8fafc"
              }}
            >
              <option value="en">English</option>
              <option value="mr">मराठी</option>
              <option value="bn">বাংলা</option>
            </select>
          </div>
        </div>

        <div>
          <label style={{ fontSize: "0.8rem", fontWeight: "600", color: "#475569", display: "block", marginBottom: "4px" }}>
            New Custom Voice Command Phrase
          </label>
          <div style={{ display: "flex", gap: "8px" }}>
            <input
              type="text"
              value={newUtterance}
              onChange={(e) => setNewUtterance(e.target.value)}
              placeholder={trainLang === "bn" ? "उदा. 'আমার প্রোফাইল খুলুন'" : trainLang === "mr" ? "उदा. 'माझे खाते लगेच उघडा'" : "e.g. 'take me straight to profile'"}
              style={{
                flex: 1,
                padding: "8px 12px",
                borderRadius: "6px",
                border: "1px solid #cbd5e1",
                fontSize: "0.9rem"
              }}
            />
            <button
              type="submit"
              disabled={loading || !newUtterance.trim()}
              style={{
                background: "#2563eb",
                color: "#ffffff",
                border: "none",
                borderRadius: "6px",
                padding: "8px 18px",
                fontWeight: "600",
                fontSize: "0.9rem",
                cursor: loading ? "wait" : "pointer",
                opacity: loading || !newUtterance.trim() ? 0.6 : 1
              }}
            >
              {loading ? "Training..." : "Add & Train"}
            </button>
          </div>
        </div>

        {statusMsg && (
          <div style={{
            padding: "8px 12px",
            borderRadius: "6px",
            fontSize: "0.85rem",
            background: statusMsg.type === "success" ? "#f0fdf4" : "#fef2f2",
            color: statusMsg.type === "success" ? "#166534" : "#991b1b",
            border: `1px solid ${statusMsg.type === "success" ? "#bbf7d0" : "#fecaca"}`
          }}>
            {statusMsg.text}
          </div>
        )}
      </form>

      {activeRouteData && (
        <div style={{ marginTop: "16px", borderTop: "1px solid #f1f5f9", paddingTop: "12px" }}>
          <div style={{ fontSize: "0.8rem", fontWeight: "600", color: "#64748b", marginBottom: "8px" }}>
            Current Trained Phrases for {trainLang === "bn" ? activeRouteData.name_bn || activeRouteData.name_en : trainLang === "mr" ? activeRouteData.name_mr : activeRouteData.name_en}:
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", maxHeight: "110px", overflowY: "auto" }}>
            {(trainLang === "bn" ? activeRouteData.utterances_bn : trainLang === "mr" ? activeRouteData.utterances_mr : activeRouteData.utterances_en)?.map((u, i) => (
              <span
                key={i}
                style={{
                  background: "#f1f5f9",
                  padding: "3px 8px",
                  borderRadius: "4px",
                  fontSize: "0.78rem",
                  color: "#334155",
                  border: "1px solid #e2e8f0"
                }}
              >
                &ldquo;{u}&rdquo;
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
