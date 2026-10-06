"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { DEMO_ROUTES } from "../lib/routesConfig";
import { useLanguage } from "../context/LanguageContext";

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const { pageLanguage, setPageLanguage } = useLanguage();

  return (
    <header style={{
      background: "#ffffff",
      borderBottom: "1px solid #e2e8f0",
      position: "sticky",
      top: 0,
      zIndex: 50,
      boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.05)"
    }}>
      <div style={{
        maxWidth: "1240px",
        margin: "0 auto",
        padding: "0 20px",
        height: "64px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px"
      }}>
        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            background: "linear-gradient(135deg, #2563eb, #7c3aed)",
            color: "#ffffff",
            width: "36px",
            height: "36px",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: "800",
            fontSize: "1.1rem"
          }}>
            🎙️
          </div>
          <div>
            <div style={{ fontWeight: "700", fontSize: "1rem", color: "#0f172a" }}>
              VoiceNav AI
            </div>
            <div style={{ fontSize: "0.72rem", color: "#64748b" }}>
              Multilingual AI Assistant
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
          {DEMO_ROUTES.map((route) => {
            const isActive = pathname === route.path;

            return (
              <Link
                key={route.route_id}
                href={route.path}
                style={{
                  padding: "7px 14px",
                  borderRadius: "6px",
                  fontSize: "0.86rem",
                  fontWeight: isActive ? "700" : "500",
                  color: isActive ? "#2563eb" : "#475569",
                  background: isActive ? "#eff6ff" : "transparent",
                  textDecoration: "none",
                  transition: "all 0.15s ease",
                  border: isActive ? "1px solid #bfdbfe" : "1px solid transparent"
                }}
              >
                {route.name_en}
              </Link>
            );
          })}
        </nav>

        {/* Page Language Switcher Control */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "0.75rem", fontWeight: "600", color: "#64748b" }}>
            🌐 Page Language:
          </span>
          <div style={{
            display: "flex",
            background: "#f1f5f9",
            borderRadius: "20px",
            padding: "2px",
            border: "1px solid #e2e8f0"
          }}>
            <button
              type="button"
              onClick={() => setPageLanguage("en")}
              style={{
                background: pageLanguage === "en" ? "#2563eb" : "transparent",
                color: pageLanguage === "en" ? "#ffffff" : "#475569",
                border: "none",
                padding: "4px 10px",
                borderRadius: "16px",
                fontSize: "0.75rem",
                fontWeight: "700",
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
              title="Set UI Language to English"
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setPageLanguage("mr")}
              style={{
                background: pageLanguage === "mr" ? "#2563eb" : "transparent",
                color: pageLanguage === "mr" ? "#ffffff" : "#475569",
                border: "none",
                padding: "4px 10px",
                borderRadius: "16px",
                fontSize: "0.75rem",
                fontWeight: "700",
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
              title="Set UI Language to मराठी"
            >
              मराठी
            </button>
            <button
              type="button"
              onClick={() => setPageLanguage("bn")}
              style={{
                background: pageLanguage === "bn" ? "#2563eb" : "transparent",
                color: pageLanguage === "bn" ? "#ffffff" : "#475569",
                border: "none",
                padding: "4px 10px",
                borderRadius: "16px",
                fontSize: "0.75rem",
                fontWeight: "700",
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
              title="Set UI Language to বাংলা"
            >
              বাংলা
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
