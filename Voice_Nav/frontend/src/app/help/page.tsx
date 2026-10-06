"use client";

import React from "react";
import { useLanguage } from "../../context/LanguageContext";

export default function HelpPage() {
  const { pageLanguage, t } = useLanguage();

  return (
    <div className="page-container">
      <div style={{ marginBottom: "28px" }}>
        <div style={{ display: "inline-block", background: "#dcfce7", color: "#166534", padding: "4px 12px", borderRadius: "16px", fontSize: "0.8rem", fontWeight: "700", marginBottom: "8px" }}>
          ❓ Voice Guide & Help Center
        </div>
        <h1 style={{ fontSize: "2rem", fontWeight: "800", color: "#0f172a" }}>
          Help & Voice Guide
        </h1>
        <p style={{ color: "#64748b", fontSize: "0.95rem" }}>
          Comprehensive cheatsheet of multilingual voice commands and auto-detection details.
        </p>
      </div>

      <div className="card" style={{ marginBottom: "24px" }}>
        <h2 style={{ fontSize: "1.2rem", fontWeight: "700", color: "#1e293b", marginBottom: "12px" }}>
          📖 Multilingual Voice Command Reference
        </h2>
        
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem", textAlign: "left" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                <th style={{ padding: "10px 14px", color: "#475569" }}>Target Page</th>
                <th style={{ padding: "10px 14px", color: "#475569" }}>Route Path</th>
                <th style={{ padding: "10px 14px", color: "#475569" }}>English Voice Examples</th>
                <th style={{ padding: "10px 14px", color: "#475569" }}>मराठी Voice Examples</th>
                <th style={{ padding: "10px 14px", color: "#475569" }}>বাংলা Voice Examples</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                <td style={{ padding: "12px 14px", fontWeight: "600" }}>Dashboard</td>
                <td style={{ padding: "12px 14px", color: "#2563eb" }}><code>/</code></td>
                <td style={{ padding: "12px 14px" }}>&ldquo;Go to home&rdquo;, &ldquo;Open dashboard&rdquo;, &ldquo;Take me home&rdquo;</td>
                <td style={{ padding: "12px 14px" }}>&ldquo;मुख्य पृष्ठावर जा&rdquo;, &ldquo;डॅशबोर्ड दाखवा&rdquo;, &ldquo;होम पेज उघडा&rdquo;</td>
                <td style={{ padding: "12px 14px" }}>&ldquo;হোম পেজে যান&rdquo;, &ldquo;ড্যাশবোর্ড খুলুন&rdquo;, &ldquo;মূল পাতা দেখাও&rdquo;</td>
              </tr>
              <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                <td style={{ padding: "12px 14px", fontWeight: "600" }}>Analytics</td>
                <td style={{ padding: "12px 14px", color: "#2563eb" }}><code>/analytics</code></td>
                <td style={{ padding: "12px 14px" }}>&ldquo;Go to analytics&rdquo;, &ldquo;Show metrics and charts&rdquo;</td>
                <td style={{ padding: "12px 14px" }}>&ldquo;ॲनालिटिक्स पृष्ठावर जा&rdquo;, &ldquo;आकडेवारी दाखवा&rdquo;</td>
                <td style={{ padding: "12px 14px" }}>&ldquo;অ্যানালিটিক্স পৃষ্ঠায় যান&rdquo;, &ldquo;পরিসংখ্যান দেখাও&rdquo;</td>
              </tr>
              <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                <td style={{ padding: "12px 14px", fontWeight: "600" }}>Profile</td>
                <td style={{ padding: "12px 14px", color: "#2563eb" }}><code>/profile</code></td>
                <td style={{ padding: "12px 14px" }}>&ldquo;Open profile&rdquo;, &ldquo;Show my account&rdquo;</td>
                <td style={{ padding: "12px 14px" }}>&ldquo;माझे प्रोफाईल दाखवा&rdquo;, &ldquo;माझे खाते उघडा&rdquo;</td>
                <td style={{ padding: "12px 14px" }}>&ldquo;আমার প্রোফাইল দেখাও&rdquo;, &ldquo;আমার একাউন্ট খুলুন&rdquo;</td>
              </tr>
              <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                <td style={{ padding: "12px 14px", fontWeight: "600" }}>Settings</td>
                <td style={{ padding: "12px 14px", color: "#2563eb" }}><code>/settings</code></td>
                <td style={{ padding: "12px 14px" }}>&ldquo;Open settings&rdquo;, &ldquo;Show configuration&rdquo;</td>
                <td style={{ padding: "12px 14px" }}>&ldquo;सेटिंग्ज उघडा&rdquo;, &ldquo;पर्याय दाखवा&rdquo;</td>
                <td style={{ padding: "12px 14px" }}>&ldquo;সেটিংস খুলুন&rdquo;, &ldquo;কনফিগারেশন দেখাও&rdquo;</td>
              </tr>
              <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                <td style={{ padding: "12px 14px", fontWeight: "600" }}>Diagnostics</td>
                <td style={{ padding: "12px 14px", color: "#2563eb" }}><code>/diagnostics</code></td>
                <td style={{ padding: "12px 14px" }}>&ldquo;Open diagnostics&rdquo;, &ldquo;System health check&rdquo;</td>
                <td style={{ padding: "12px 14px" }}>&ldquo;निदान पृष्ठ उघडा&rdquo;, &ldquo;सिस्टम स्थिती तपासा&rdquo;</td>
                <td style={{ padding: "12px 14px" }}>&ldquo;ডায়াগনস্টিকস পেজ খুলুন&rdquo;, &ldquo;সিস্টেম স্বাস্থ্য পরীক্ষা&rdquo;</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="card" style={{ background: "#fffbeb", border: "1px solid #fde68a" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
          <span style={{ fontSize: "1.2rem" }}>🚧</span>
          <h3 style={{ fontSize: "1.05rem", fontWeight: "700", color: "#92400e" }}>
            Problem Solving & Q&A Engine (Under Development)
          </h3>
        </div>
        <p style={{ fontSize: "0.88rem", color: "#78350f" }}>
          As specified in the requirements, the complex problem-solving module (integrating domain ML models like Qwen2.5, MobileNet3, XGBoost) is kept on hold with a clean modular endpoint. When you ask general questions or describe problems, the assistant acknowledges the request with a structured response.
        </p>
      </div>
    </div>
  );
}
