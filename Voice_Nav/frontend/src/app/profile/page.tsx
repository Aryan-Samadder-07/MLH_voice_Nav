"use client";

import React from "react";
import { useLanguage } from "../../context/LanguageContext";

export default function ProfilePage() {
  const { preferredLanguage } = useLanguage();

  return (
    <div className="page-container">
      <div style={{ marginBottom: "28px" }}>
        <div style={{ display: "inline-block", background: "#f3e8ff", color: "#6b21a8", padding: "4px 12px", borderRadius: "16px", fontSize: "0.8rem", fontWeight: "700", marginBottom: "8px" }}>
          👤 User Profile
        </div>
        <h1 style={{ fontSize: "2rem", fontWeight: "800", color: "#0f172a" }}>
          User Profile
        </h1>
        <p style={{ color: "#64748b", fontSize: "0.95rem" }}>
          Voice navigation destination for user details, preferences, and activity history.
        </p>
      </div>

      <div className="grid-2">
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "20px" }}>
            <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "#2563eb", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", fontWeight: "700" }}>
              AS
            </div>
            <div>
              <h2 style={{ fontSize: "1.2rem", fontWeight: "700", color: "#0f172a" }}>Aryan Samadder</h2>
              <div style={{ fontSize: "0.85rem", color: "#64748b" }}>Primary Developer & Admin</div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "0.9rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: "8px" }}>
              <span style={{ color: "#64748b" }}>AI Preferred Voice Language</span>
              <span style={{ fontWeight: "700", color: "#2563eb" }}>
                {preferredLanguage.toUpperCase()}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: "8px" }}>
              <span style={{ color: "#64748b" }}>Voice Navigation Status</span>
              <span style={{ fontWeight: "600", color: "#16a34a" }}>Active</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: "8px" }}>
              <span style={{ color: "#64748b" }}>Assigned Role</span>
              <span style={{ fontWeight: "600" }}>AI System Integrator</span>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 style={{ fontSize: "1.1rem", fontWeight: "700", marginBottom: "12px", color: "#1e293b" }}>
            Recent Voice Activities
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "0.85rem" }}>
            <div style={{ background: "#f8fafc", padding: "10px", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
              <div style={{ fontWeight: "600", color: "#0f172a" }}>🗣️ Voice Command in Bengali</div>
              <div style={{ color: "#64748b", marginTop: "2px" }}>&ldquo;আমার প্রোফাইল দেখাও&rdquo; ➔ Navigated to <code>/profile</code></div>
            </div>
            <div style={{ background: "#f8fafc", padding: "10px", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
              <div style={{ fontWeight: "600", color: "#0f172a" }}>🗣️ Voice Command in Marathi</div>
              <div style={{ color: "#64748b", marginTop: "2px" }}>&ldquo;माझे प्रोफाईल दाखवा&rdquo; ➔ Navigated to <code>/profile</code></div>
            </div>
            <div style={{ background: "#f8fafc", padding: "10px", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
              <div style={{ fontWeight: "600", color: "#0f172a" }}>🗣️ Voice Command in English</div>
              <div style={{ color: "#64748b", marginTop: "2px" }}>&ldquo;Go to settings&rdquo; ➔ Navigated to <code>/settings</code></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
