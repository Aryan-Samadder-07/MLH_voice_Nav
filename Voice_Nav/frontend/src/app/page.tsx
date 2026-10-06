"use client";

import React from "react";
import Link from "next/link";
import { DEMO_ROUTES } from "../lib/routesConfig";

export default function HomePage() {
  return (
    <div className="page-container">
      {/* Hero Welcome */}
      <div style={{ marginBottom: "28px" }}>
        <div style={{ display: "inline-block", background: "#dbeafe", color: "#1e40af", padding: "4px 12px", borderRadius: "16px", fontSize: "0.8rem", fontWeight: "700", marginBottom: "8px" }}>
          🚀 Mini Project Demo
        </div>
        <h1 style={{ fontSize: "2rem", fontWeight: "800", color: "#0f172a", margin: "4px 0" }}>
          Dashboard
        </h1>
        <p style={{ color: "#64748b", fontSize: "1rem" }}>
          Speak naturally in your preferred language to navigate anywhere instantly.
        </p>
      </div>

      {/* Quick Voice Demo Suggestions */}
      <div className="card" style={{ marginBottom: "24px", background: "linear-gradient(135deg, #f0fdf4 0%, #e0f2fe 100%)", border: "1px solid #bae6fd" }}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: "700", color: "#0369a1", marginBottom: "8px" }}>
          💡 Voice Commands to Try Right Now:
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "12px" }}>
          <div style={{ background: "#ffffff", padding: "12px", borderRadius: "8px", border: "1px solid #e0f2fe" }}>
            <div style={{ fontSize: "0.85rem", fontWeight: "700", color: "#0284c7" }}>English Commands:</div>
            <ul style={{ paddingLeft: "18px", fontSize: "0.85rem", color: "#334155", marginTop: "4px" }}>
              <li>&ldquo;Go to analytics page&rdquo;</li>
              <li>&ldquo;Open my profile&rdquo;</li>
              <li>&ldquo;Show system settings&rdquo;</li>
              <li>&ldquo;Open diagnostics&rdquo;</li>
            </ul>
          </div>
          <div style={{ background: "#ffffff", padding: "12px", borderRadius: "8px", border: "1px solid #e0f2fe" }}>
            <div style={{ fontSize: "0.85rem", fontWeight: "700", color: "#0284c7" }}>Marathi Commands:</div>
            <ul style={{ paddingLeft: "18px", fontSize: "0.85rem", color: "#334155", marginTop: "4px" }}>
              <li>&ldquo;मला ॲनालिटिक्स दाखवा&rdquo;</li>
              <li>&ldquo;माझे प्रोफाईल उघडा&rdquo;</li>
              <li>&ldquo;सेटिंग्ज पृष्ठावर जा&rdquo;</li>
              <li>&ldquo;निदान चाचणी उघडा&rdquo;</li>
            </ul>
          </div>
          <div style={{ background: "#ffffff", padding: "12px", borderRadius: "8px", border: "1px solid #e0f2fe" }}>
            <div style={{ fontSize: "0.85rem", fontWeight: "700", color: "#0284c7" }}>Bengali Commands:</div>
            <ul style={{ paddingLeft: "18px", fontSize: "0.85rem", color: "#334155", marginTop: "4px" }}>
              <li>&ldquo;অ্যানালিটিক্স পৃষ্ঠায় যান&rdquo;</li>
              <li>&ldquo;আমার প্রোফাইল দেখাও&rdquo;</li>
              <li>&ldquo;সেটিংস পেজ খুলুন&rdquo;</li>
              <li>&ldquo;ডায়াগনস্টিকস পরীক্ষা দেখাও&rdquo;</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Grid of Available Pages */}
      <h2 style={{ fontSize: "1.3rem", fontWeight: "700", marginBottom: "16px", color: "#1e293b" }}>
        Available Demo Routes
      </h2>
      <div className="grid-3">
        {DEMO_ROUTES.map((route) => (
          <div key={route.route_id} className="card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                <span className="badge" style={{ background: "#f1f5f9", color: "#475569" }}>
                  {route.path}
                </span>
                <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>ID: {route.route_id}</span>
              </div>
              <h3 style={{ fontSize: "1.15rem", fontWeight: "700", color: "#0f172a" }}>
                {route.name_en}
              </h3>
              <p style={{ color: "#64748b", fontSize: "0.85rem", marginTop: "6px" }}>
                {route.description}
              </p>
            </div>
            
            <div style={{ marginTop: "16px", paddingTop: "12px", borderTop: "1px solid #f1f5f9" }}>
              <Link
                href={route.path}
                style={{
                  display: "inline-block",
                  fontSize: "0.85rem",
                  fontWeight: "600",
                  color: "#2563eb"
                }}
              >
                View Page →
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
