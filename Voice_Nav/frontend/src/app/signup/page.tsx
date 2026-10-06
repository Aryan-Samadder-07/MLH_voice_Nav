"use client";

import React, { useState, useEffect, useRef } from "react";

interface UserRecord {
  id: number;
  name: string;
  phone: string;
  village: string;
  state: string;
  preferred_language: string;
  created_at: string;
}

export default function SignupPage() {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    village: "",
    state: "",
    preferred_language: "en"
  });

  const [aiUpdatedFields, setAiUpdatedFields] = useState<string[]>([]);
  const [activeHighlightField, setActiveHighlightField] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [fetchingUsers, setFetchingUsers] = useState<boolean>(false);

  // References for focusing fields
  const nameInputRef = useRef<HTMLInputElement>(null);
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const villageInputRef = useRef<HTMLInputElement>(null);
  const stateInputRef = useRef<HTMLInputElement>(null);
  const langSelectRef = useRef<HTMLSelectElement>(null);

  // Fetch registered users from backend SQLite DB
  const loadUsers = async () => {
    setFetchingUsers(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/api/assistant/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (err) {
      console.warn("Failed to load users from backend:", err);
    } finally {
      setFetchingUsers(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // Broadcast form state changes to VoiceAssistant
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("custom:form_state_changed", { detail: formData })
    );
  }, [formData]);

  // Submit handler
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!formData.name.trim()) {
      setStatusMessage({ type: "error", text: "Please enter your Name." });
      nameInputRef.current?.focus();
      return;
    }
    if (!formData.phone.trim() || formData.phone.length < 10) {
      setStatusMessage({ type: "error", text: "Please enter a valid 10-digit Phone Number." });
      phoneInputRef.current?.focus();
      return;
    }
    if (!formData.village.trim()) {
      setStatusMessage({ type: "error", text: "Please enter your Village name." });
      villageInputRef.current?.focus();
      return;
    }
    if (!formData.state.trim()) {
      setStatusMessage({ type: "error", text: "Please enter your State name." });
      stateInputRef.current?.focus();
      return;
    }

    setLoading(true);
    setStatusMessage(null);

    try {
      const res = await fetch("http://127.0.0.1:8000/api/assistant/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (res.ok) {
        setStatusMessage({
          type: "success",
          text: `Registration successful! Record saved to local database (User ID: #${data.user?.id || 1}).`
        });
        // Reset form
        setFormData({
          name: "",
          phone: "",
          village: "",
          state: "",
          preferred_language: "en"
        });
        setAiUpdatedFields([]);
        setActiveHighlightField(null);
        // Refresh users list
        loadUsers();
      } else {
        setStatusMessage({
          type: "error",
          text: data.detail || "Failed to register user."
        });
      }
    } catch (err: any) {
      setStatusMessage({
        type: "error",
        text: "Error connecting to backend database: " + err.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setFormData({
      name: "",
      phone: "",
      village: "",
      state: "",
      preferred_language: "en"
    });
    setAiUpdatedFields([]);
    setActiveHighlightField(null);
    setStatusMessage(null);
  };

  const handleDeleteUser = async (id: number) => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/assistant/users/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        loadUsers();
      }
    } catch (err) {
      console.error("Error deleting user:", err);
    }
  };

  // Listen for AI assistant voice events
  useEffect(() => {
    const handleFormUpdate = (e: any) => {
      const incoming = e.detail || {};
      const updatedKeys: string[] = [];

      setFormData((prev) => {
        const next = { ...prev };
        if (incoming.name !== undefined && incoming.name !== null) {
          next.name = incoming.name;
          updatedKeys.push("name");
        }
        if (incoming.phone !== undefined && incoming.phone !== null) {
          next.phone = incoming.phone;
          updatedKeys.push("phone");
        }
        if (incoming.village !== undefined && incoming.village !== null) {
          next.village = incoming.village;
          updatedKeys.push("village");
        }
        if (incoming.state !== undefined && incoming.state !== null) {
          next.state = incoming.state;
          updatedKeys.push("state");
        }
        if (incoming.preferred_language !== undefined && incoming.preferred_language !== null) {
          next.preferred_language = incoming.preferred_language;
          updatedKeys.push("preferred_language");
        }
        return next;
      });

      if (updatedKeys.length > 0) {
        const lastKey = updatedKeys[updatedKeys.length - 1];
        setActiveHighlightField(lastKey);
        setAiUpdatedFields((prev) => Array.from(new Set([...prev, ...updatedKeys])));

        // Focus corresponding input
        if (lastKey === "name") nameInputRef.current?.focus();
        else if (lastKey === "phone") phoneInputRef.current?.focus();
        else if (lastKey === "village") villageInputRef.current?.focus();
        else if (lastKey === "state") stateInputRef.current?.focus();
        else if (lastKey === "preferred_language") langSelectRef.current?.focus();

        // Clear highlight pulse after 2.5s
        setTimeout(() => {
          setActiveHighlightField(null);
        }, 2500);
      }
    };

    const handleFormSubmitEvent = () => {
      handleSubmit();
    };

    const handleFormClearEvent = () => {
      handleClear();
    };

    window.addEventListener("custom:form_update", handleFormUpdate);
    window.addEventListener("custom:form_submit", handleFormSubmitEvent);
    window.addEventListener("custom:form_clear", handleFormClearEvent);

    return () => {
      window.removeEventListener("custom:form_update", handleFormUpdate);
      window.removeEventListener("custom:form_submit", handleFormSubmitEvent);
      window.removeEventListener("custom:form_clear", handleFormClearEvent);
    };
  }, [formData]);

  return (
    <div className="page-container">
      {/* Page Header */}
      <div style={{ marginBottom: "28px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
          <span style={{ fontSize: "1.8rem" }}>📝</span>
          <h1 style={{ fontSize: "1.85rem", fontWeight: "800", color: "#0f172a" }}>
            Sign Up & User Registration
          </h1>
        </div>
        <p style={{ color: "#64748b", fontSize: "0.95rem" }}>
          Fill details manually or use the AI Voice Assistant to fill them interactively step-by-step.
        </p>
      </div>

      {/* Voice Assistant Tip Banner */}
      <div style={{
        background: "linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%)",
        border: "1px solid #bfdbfe",
        borderRadius: "12px",
        padding: "16px 20px",
        marginBottom: "28px",
        display: "flex",
        alignItems: "flex-start",
        gap: "14px"
      }}>
        <div style={{ fontSize: "1.5rem", lineHeight: 1 }}>🎙️</div>
        <div>
          <div style={{ fontWeight: "700", color: "#1e3a8a", fontSize: "0.92rem", marginBottom: "4px" }}>
            Interactive AI Form Filling Enabled
          </div>
          <div style={{ color: "#334155", fontSize: "0.85rem", lineHeight: "1.4" }}>
            You can say: <strong>&ldquo;My name is Ramesh&rdquo;</strong>, <strong>&ldquo;Phone 9876543210&rdquo;</strong>, <strong>&ldquo;Village Rampur and state Maharashtra&rdquo;</strong>, or <strong>&ldquo;Submit the form&rdquo;</strong> in English, Marathi, or Bengali.
          </div>
        </div>
      </div>

      {/* Main Grid: Form + Users List */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "24px" }}>
        {/* Left Column: Form */}
        <div className="card" style={{ padding: "28px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
            <h2 style={{ fontSize: "1.2rem", fontWeight: "700", color: "#0f172a" }}>
              User Details Form
            </h2>
            {aiUpdatedFields.length > 0 && (
              <span className="badge" style={{ background: "#dcfce7", color: "#166534" }}>
                ✨ {aiUpdatedFields.length} field(s) filled by AI
              </span>
            )}
          </div>

          {statusMessage && (
            <div style={{
              padding: "12px 16px",
              borderRadius: "8px",
              marginBottom: "20px",
              fontSize: "0.88rem",
              fontWeight: "600",
              background: statusMessage.type === "success" ? "#dcfce7" : "#fee2e2",
              color: statusMessage.type === "success" ? "#15803d" : "#b91c1c",
              border: `1px solid ${statusMessage.type === "success" ? "#86efac" : "#fca5a5"}`
            }}>
              {statusMessage.text}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            {/* Field 1: Name */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <label style={{ fontSize: "0.86rem", fontWeight: "700", color: "#334155" }}>
                  👤 Full Name (English & Local)
                </label>
                <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                  {aiUpdatedFields.includes("name") && (
                    <span style={{ fontSize: "0.72rem", color: "#16a34a", fontWeight: "600" }}>✓ AI Filled</span>
                  )}
                </div>
              </div>
              <input
                ref={nameInputRef}
                type="text"
                placeholder="e.g. Ramesh (রমেশ) / Ramesh"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  border: activeHighlightField === "name" ? "2px solid #2563eb" : "1px solid #cbd5e1",
                  outline: "none",
                  fontSize: "0.92rem",
                  background: activeHighlightField === "name" ? "#eff6ff" : "#ffffff",
                  transition: "all 0.25s ease",
                  boxShadow: activeHighlightField === "name" ? "0 0 0 3px rgba(37, 99, 235, 0.2)" : "none"
                }}
              />
              {formData.name.includes("(") && formData.name.includes(")") && (
                <div style={{ marginTop: "4px", fontSize: "0.75rem", color: "#475569", display: "flex", gap: "8px" }}>
                  <span style={{ background: "#f1f5f9", padding: "2px 6px", borderRadius: "4px" }}>
                    🔤 English: <strong>{formData.name.split("(")[0].trim()}</strong>
                  </span>
                  <span style={{ background: "#eff6ff", color: "#1e40af", padding: "2px 6px", borderRadius: "4px" }}>
                    🗣️ Local: <strong>{formData.name.split("(")[1].replace(")", "").trim()}</strong>
                  </span>
                </div>
              )}
            </div>

            {/* Field 2: Phone Number */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <label style={{ fontSize: "0.86rem", fontWeight: "700", color: "#334155" }}>
                  📱 Phone Number (10 digits)
                </label>
                <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                  {formData.phone.length === 10 ? (
                    <span style={{ fontSize: "0.72rem", color: "#16a34a", fontWeight: "700" }}>✅ 10/10 digits (Valid)</span>
                  ) : formData.phone.length > 0 ? (
                    <span style={{ fontSize: "0.72rem", color: "#d97706", fontWeight: "600" }}>
                      ⚠️ {formData.phone.length}/10 digits ({10 - formData.phone.length} remaining)
                    </span>
                  ) : (
                    <span style={{ fontSize: "0.72rem", color: "#94a3b8" }}>10 digits required</span>
                  )}
                  {aiUpdatedFields.includes("phone") && (
                    <span style={{ fontSize: "0.72rem", color: "#16a34a", fontWeight: "600" }}>✓ AI Filled</span>
                  )}
                </div>
              </div>
              <input
                ref={phoneInputRef}
                type="tel"
                placeholder="e.g. 9876543210"
                maxLength={10}
                value={formData.phone}
                onChange={(e) => {
                  const cleaned = e.target.value.replace(/\D/g, "").slice(0, 10);
                  setFormData({ ...formData, phone: cleaned });
                }}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  border: activeHighlightField === "phone" ? "2px solid #2563eb" : (formData.phone.length > 0 && formData.phone.length < 10 ? "1px solid #f59e0b" : "1px solid #cbd5e1"),
                  outline: "none",
                  fontSize: "0.92rem",
                  background: activeHighlightField === "phone" ? "#eff6ff" : "#ffffff",
                  transition: "all 0.25s ease",
                  boxShadow: activeHighlightField === "phone" ? "0 0 0 3px rgba(37, 99, 235, 0.2)" : "none"
                }}
              />
            </div>

            {/* Field 3: Village */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <label style={{ fontSize: "0.86rem", fontWeight: "700", color: "#334155" }}>
                  🏡 Village / Town Name (English & Local)
                </label>
                {aiUpdatedFields.includes("village") && (
                  <span style={{ fontSize: "0.72rem", color: "#16a34a", fontWeight: "600" }}>✓ AI Filled</span>
                )}
              </div>
              <input
                ref={villageInputRef}
                type="text"
                placeholder="e.g. Rampur (রামপুর)"
                value={formData.village}
                onChange={(e) => setFormData({ ...formData, village: e.target.value })}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  border: activeHighlightField === "village" ? "2px solid #2563eb" : "1px solid #cbd5e1",
                  outline: "none",
                  fontSize: "0.92rem",
                  background: activeHighlightField === "village" ? "#eff6ff" : "#ffffff",
                  transition: "all 0.25s ease",
                  boxShadow: activeHighlightField === "village" ? "0 0 0 3px rgba(37, 99, 235, 0.2)" : "none"
                }}
              />
              {formData.village.includes("(") && formData.village.includes(")") && (
                <div style={{ marginTop: "4px", fontSize: "0.75rem", color: "#475569", display: "flex", gap: "8px" }}>
                  <span style={{ background: "#f1f5f9", padding: "2px 6px", borderRadius: "4px" }}>
                    🔤 English: <strong>{formData.village.split("(")[0].trim()}</strong>
                  </span>
                  <span style={{ background: "#eff6ff", color: "#1e40af", padding: "2px 6px", borderRadius: "4px" }}>
                    🗣️ Local: <strong>{formData.village.split("(")[1].replace(")", "").trim()}</strong>
                  </span>
                </div>
              )}
            </div>

            {/* Field 4: State */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <label style={{ fontSize: "0.86rem", fontWeight: "700", color: "#334155" }}>
                  🗺️ State Name (English & Local)
                </label>
                {aiUpdatedFields.includes("state") && (
                  <span style={{ fontSize: "0.72rem", color: "#16a34a", fontWeight: "600" }}>✓ AI Filled</span>
                )}
              </div>
              <input
                ref={stateInputRef}
                type="text"
                placeholder="e.g. West Bengal (পশ্চিমবঙ্গ) / Maharashtra"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  border: activeHighlightField === "state" ? "2px solid #2563eb" : "1px solid #cbd5e1",
                  outline: "none",
                  fontSize: "0.92rem",
                  background: activeHighlightField === "state" ? "#eff6ff" : "#ffffff",
                  transition: "all 0.25s ease",
                  boxShadow: activeHighlightField === "state" ? "0 0 0 3px rgba(37, 99, 235, 0.2)" : "none"
                }}
              />
              {formData.state.includes("(") && formData.state.includes(")") && (
                <div style={{ marginTop: "4px", fontSize: "0.75rem", color: "#475569", display: "flex", gap: "8px" }}>
                  <span style={{ background: "#f1f5f9", padding: "2px 6px", borderRadius: "4px" }}>
                    🔤 English: <strong>{formData.state.split("(")[0].trim()}</strong>
                  </span>
                  <span style={{ background: "#eff6ff", color: "#1e40af", padding: "2px 6px", borderRadius: "4px" }}>
                    🗣️ Local: <strong>{formData.state.split("(")[1].replace(")", "").trim()}</strong>
                  </span>
                </div>
              )}
            </div>

            {/* Field 5: Preferred Language Dropdown */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <label style={{ fontSize: "0.86rem", fontWeight: "700", color: "#334155" }}>
                  🌐 Preferred Language
                </label>
                {aiUpdatedFields.includes("preferred_language") && (
                  <span style={{ fontSize: "0.72rem", color: "#16a34a", fontWeight: "600" }}>✓ AI Filled</span>
                )}
              </div>
              <select
                ref={langSelectRef}
                value={formData.preferred_language}
                onChange={(e) => setFormData({ ...formData, preferred_language: e.target.value })}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  border: activeHighlightField === "preferred_language" ? "2px solid #2563eb" : "1px solid #cbd5e1",
                  outline: "none",
                  fontSize: "0.92rem",
                  background: activeHighlightField === "preferred_language" ? "#eff6ff" : "#ffffff",
                  cursor: "pointer",
                  transition: "all 0.25s ease",
                  boxShadow: activeHighlightField === "preferred_language" ? "0 0 0 3px rgba(37, 99, 235, 0.2)" : "none"
                }}
              >
                <option value="en">English</option>
                <option value="mr">Marathi (मराठी)</option>
                <option value="bn">Bengali (বাংলা)</option>
                <option value="hi">Hindi (हिंदी)</option>
                <option value="ta">Tamil (தமிழ்)</option>
                <option value="te">Telugu (తెలుగు)</option>
                <option value="gu">Gujarati (ગુજરાતી)</option>
                <option value="kn">Kannada (ಕನ್ನಡ)</option>
                <option value="ml">Malayalam (മലയാളം)</option>
                <option value="pa">Punjabi (ਪੰਜਾਬੀ)</option>
                <option value="ur">Urdu (اردو)</option>
              </select>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: "12px", marginTop: "10px" }}>
              <button
                type="submit"
                disabled={loading}
                style={{
                  flex: 1,
                  background: "#2563eb",
                  color: "#ffffff",
                  padding: "12px 18px",
                  borderRadius: "8px",
                  border: "none",
                  fontWeight: "700",
                  fontSize: "0.95rem",
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.7 : 1,
                  transition: "background 0.2s ease"
                }}
              >
                {loading ? "Registering..." : "Submit Registration"}
              </button>
              <button
                type="button"
                onClick={handleClear}
                style={{
                  background: "#f1f5f9",
                  color: "#475569",
                  padding: "12px 18px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontWeight: "600",
                  fontSize: "0.95rem",
                  cursor: "pointer"
                }}
              >
                Clear
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Local SQLite Database View */}
        <div className="card" style={{ padding: "28px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px" }}>
            <div>
              <h2 style={{ fontSize: "1.2rem", fontWeight: "700", color: "#0f172a" }}>
                Local Database Records
              </h2>
              <div style={{ fontSize: "0.78rem", color: "#64748b" }}>
                Persisted in SQLite database (`backend/app/data/app.db`)
              </div>
            </div>
            <button
              onClick={loadUsers}
              disabled={fetchingUsers}
              style={{
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                padding: "6px 12px",
                borderRadius: "6px",
                fontSize: "0.8rem",
                fontWeight: "600",
                color: "#2563eb",
                cursor: "pointer"
              }}
            >
              🔄 Refresh
            </button>
          </div>

          {users.length === 0 ? (
            <div style={{
              textAlign: "center",
              padding: "48px 20px",
              color: "#94a3b8",
              background: "#f8fafc",
              borderRadius: "8px",
              border: "1px dashed #cbd5e1"
            }}>
              <div style={{ fontSize: "2rem", marginBottom: "8px" }}>📂</div>
              <div style={{ fontWeight: "600", color: "#64748b" }}>No registered users yet</div>
              <div style={{ fontSize: "0.82rem", marginTop: "4px" }}>
                Fill details manually or use voice command to register the first user!
              </div>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.84rem" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #e2e8f0", textAlign: "left", color: "#64748b" }}>
                    <th style={{ padding: "8px 6px" }}>ID</th>
                    <th style={{ padding: "8px 6px" }}>Name</th>
                    <th style={{ padding: "8px 6px" }}>Phone</th>
                    <th style={{ padding: "8px 6px" }}>Village & State</th>
                    <th style={{ padding: "8px 6px" }}>Lang</th>
                    <th style={{ padding: "8px 6px", textAlign: "center" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "10px 6px", fontWeight: "700", color: "#64748b" }}>#{u.id}</td>
                      <td style={{ padding: "10px 6px", fontWeight: "600", color: "#0f172a" }}>{u.name}</td>
                      <td style={{ padding: "10px 6px", color: "#334155" }}>{u.phone}</td>
                      <td style={{ padding: "10px 6px", color: "#475569" }}>
                        {u.village}, {u.state}
                      </td>
                      <td style={{ padding: "10px 6px" }}>
                        <span className="badge" style={{ background: "#e0e7ff", color: "#3730a3", textTransform: "uppercase" }}>
                          {u.preferred_language}
                        </span>
                      </td>
                      <td style={{ padding: "10px 6px", textAlign: "center" }}>
                        <button
                          onClick={() => handleDeleteUser(u.id)}
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "#ef4444",
                            cursor: "pointer",
                            fontSize: "0.88rem",
                            padding: "4px"
                          }}
                          title="Delete Record"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
