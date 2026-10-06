"use client";

import React from "react";

export default function AnalyticsPage() {
  return (
    <div className="page-container">
      <div style={{ marginBottom: "28px" }}>
        <div style={{ display: "inline-block", background: "#fef3c7", color: "#92400e", padding: "4px 12px", borderRadius: "16px", fontSize: "0.8rem", fontWeight: "700", marginBottom: "8px" }}>
          📊 Metrics & Insights
        </div>
        <h1 style={{ fontSize: "2rem", fontWeight: "800", color: "#0f172a" }}>
          Analytics
        </h1>
        <p style={{ color: "#64748b", fontSize: "0.95rem" }}>
          Voice navigation target demonstration for analytics, charts, accuracy, and usage statistics.
        </p>
      </div>

      <div className="grid-3" style={{ marginBottom: "24px" }}>
        <div className="card">
          <div style={{ fontSize: "0.85rem", color: "#64748b" }}>Voice Navigation Accuracy</div>
          <div style={{ fontSize: "1.8rem", fontWeight: "800", color: "#16a34a", marginTop: "4px" }}>98.4%</div>
          <div style={{ fontSize: "0.75rem", color: "#15803d", marginTop: "4px" }}>↑ +2.1% across Multilingual commands</div>
        </div>
        <div className="card">
          <div style={{ fontSize: "0.85rem", color: "#64748b" }}>Average Response Latency</div>
          <div style={{ fontSize: "1.8rem", fontWeight: "800", color: "#2563eb", marginTop: "4px" }}>45 ms</div>
          <div style={{ fontSize: "0.75rem", color: "#1d4ed8", marginTop: "4px" }}>Fuzzy rapid token scoring</div>
        </div>
        <div className="card">
          <div style={{ fontSize: "0.85rem", color: "#64748b" }}>Supported Languages</div>
          <div style={{ fontSize: "1.8rem", fontWeight: "800", color: "#7c3aed", marginTop: "4px" }}>Auto Multi</div>
          <div style={{ fontSize: "0.75rem", color: "#6d28d9", marginTop: "4px" }}>English, Marathi, Bengali, Hindi & 100+</div>
        </div>
      </div>

      <div className="card">
        <h2 style={{ fontSize: "1.1rem", fontWeight: "700", marginBottom: "12px", color: "#1e293b" }}>
          Intent Match Breakdown
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: "4px" }}>
              <span>Dashboard & Overview Navigation</span>
              <span>42%</span>
            </div>
            <div style={{ height: "8px", background: "#e2e8f0", borderRadius: "4px", overflow: "hidden" }}>
              <div style={{ width: "42%", height: "100%", background: "#2563eb" }} />
            </div>
          </div>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: "4px" }}>
              <span>Settings & Configuration Commands</span>
              <span>28%</span>
            </div>
            <div style={{ height: "8px", background: "#e2e8f0", borderRadius: "4px", overflow: "hidden" }}>
              <div style={{ width: "28%", height: "100%", background: "#06b6d4" }} />
            </div>
          </div>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: "4px" }}>
              <span>Profile & Account Queries</span>
              <span>18%</span>
            </div>
            <div style={{ height: "8px", background: "#e2e8f0", borderRadius: "4px", overflow: "hidden" }}>
              <div style={{ width: "18%", height: "100%", background: "#8b5cf6" }} />
            </div>
          </div>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: "4px" }}>
              <span>Help & Problem-Solving Stubs</span>
              <span>12%</span>
            </div>
            <div style={{ height: "8px", background: "#e2e8f0", borderRadius: "4px", overflow: "hidden" }}>
              <div style={{ width: "12%", height: "100%", background: "#f59e0b" }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
