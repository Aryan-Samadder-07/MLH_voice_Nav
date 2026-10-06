"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import { Leaf, Phone, ShieldCheck, ArrowRight, RefreshCw, KeyRound, Sparkles, CheckCircle2 } from "lucide-react";

export default function LoginPage() {
  const { loginUser, refreshUsers, currentUser } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (currentUser) {
      let targetPath = "/";
      switch (currentUser.role) {
        case "FARMER": targetPath = "/farmer"; break;
        case "BUYER": targetPath = "/buyer"; break;
        case "TRANSPORTER": targetPath = "/transporter"; break;
        case "ADMIN": targetPath = "/admin"; break;
        default: targetPath = "/";
      }
      router.replace(targetPath);
    }
  }, [currentUser, router]);

  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [aiUpdatedFields, setAiUpdatedFields] = useState<string[]>([]);

  // Generate random 4-digit OTP and display prominently on screen
  const handleSendOtp = (customCode?: string) => {
    const cleanPhone = phone.trim().replace(/\D/g, "");
    if (!cleanPhone) {
      setError("Please enter a phone number before requesting an OTP.");
      return;
    }
    setError(null);

    const code = customCode || Math.floor(1000 + Math.random() * 9000).toString();
    setGeneratedOtp(code);
    setOtpSent(true);
    setSuccessMsg(`OTP generated successfully! Enter verification code ${code} to confirm.`);
  };

  // Broadcast form state to Voice Assistant
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("custom:form_state_changed", {
        detail: { phone, otp, page: "login", otpSent, generatedOtp }
      })
    );
  }, [phone, otp, otpSent, generatedOtp]);

  // Listen for AI assistant voice events
  useEffect(() => {
    const handleFormUpdate = (e: any) => {
      const incoming = e.detail || {};
      const updatedKeys: string[] = [];

      if (incoming.phone !== undefined && incoming.phone !== null) {
        const p = String(incoming.phone).replace(/\D/g, "");
        setPhone(p);
        updatedKeys.push("phone");
      }
      if (incoming.otp !== undefined && incoming.otp !== null) {
        const o = String(incoming.otp).replace(/\D/g, "");
        setOtp(o);
        updatedKeys.push("otp");
      }

      if (updatedKeys.length > 0) {
        setAiUpdatedFields((prev) => Array.from(new Set([...prev, ...updatedKeys])));
      }
    };

    const handleSendOtpEvent = (e: any) => {
      const code = e.detail?.otp;
      handleSendOtp(code);
    };

    const handleFormSubmitEvent = () => {
      handleSubmit();
    };

    const handleFormClearEvent = () => {
      setPhone("");
      setOtp("");
      setGeneratedOtp(null);
      setOtpSent(false);
      setAiUpdatedFields([]);
      setError(null);
      setSuccessMsg(null);
    };

    window.addEventListener("custom:form_update", handleFormUpdate);
    window.addEventListener("custom:send_otp", handleSendOtpEvent);
    window.addEventListener("custom:form_submit", handleFormSubmitEvent);
    window.addEventListener("custom:form_clear", handleFormClearEvent);

    return () => {
      window.removeEventListener("custom:form_update", handleFormUpdate);
      window.removeEventListener("custom:send_otp", handleSendOtpEvent);
      window.removeEventListener("custom:form_submit", handleFormSubmitEvent);
      window.removeEventListener("custom:form_clear", handleFormClearEvent);
    };
  }, [phone, otp, generatedOtp]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);

    const cleanPhone = phone.trim().replace(/\D/g, "");
    if (!cleanPhone) {
      setError("Please enter a phone number.");
      return;
    }

    if (!otpSent || !generatedOtp) {
      setError("Please click 'Send OTP' or say 'Send OTP' first.");
      return;
    }

    if (!otp.trim() || otp.trim() !== generatedOtp) {
      setError(`Invalid OTP. Please enter the ${generatedOtp} verification code shown above.`);
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: cleanPhone, otp: otp.trim() })
      });

      const data = await response.json();

      if (response.ok) {
        window.dispatchEvent(new CustomEvent("custom:form_state_cleared"));
        await refreshUsers();
        loginUser(data);
        
        let targetPath = "/";
        switch (data.role) {
          case "FARMER": targetPath = "/farmer"; break;
          case "BUYER": targetPath = "/buyer"; break;
          case "TRANSPORTER": targetPath = "/transporter"; break;
          case "ADMIN": targetPath = "/admin"; break;
          default: targetPath = "/";
        }
        router.push(targetPath);
      } else {
        setError(data.error || "Login failed");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("An unexpected network error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  const phoneDigitCount = phone.replace(/\D/g, "").length;

  return (
    <div className="min-h-[85vh] flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-slate-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-emerald-100 text-emerald-600 mb-3">
          <Leaf className="h-7 w-7 fill-emerald-100" />
        </div>
        <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Log in with OTP</h2>
        <p className="mt-2 text-sm text-slate-500">
          Enter your 10-digit phone number & confirm with one-time verification code!
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-md border border-slate-200 sm:rounded-xl sm:px-10 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500"></div>

          {/* Prominent On-Screen OTP Banner */}
          {generatedOtp && (
            <div className="mb-5 bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-300 p-4 rounded-xl shadow-xs animate-in fade-in zoom-in duration-300">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5 uppercase tracking-wide">
                  <Sparkles className="h-4 w-4 text-emerald-600" /> Phone Confirmation Code
                </span>
                <span className="text-[10px] font-extrabold bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full">
                  VALID NOW
                </span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <div className="text-2xl font-black tracking-widest text-emerald-800 bg-white px-3 py-1.5 rounded-lg border border-emerald-200 shadow-inner">
                  {generatedOtp.split("").join(" ")}
                </div>
                <button
                  type="button"
                  onClick={() => setOtp(generatedOtp)}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-100 hover:bg-emerald-200 px-3 py-2 rounded-lg transition"
                >
                  Auto-fill OTP
                </button>
              </div>
              <p className="text-[11px] text-emerald-700 mt-2">
                Say <span className="font-bold underline">"OTP is {generatedOtp}"</span> or enter it below to confirm.
              </p>
            </div>
          )}

          {error && (
            <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-lg font-medium">
              {error}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1 flex items-center justify-between">
                <span>Phone Number</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  phoneDigitCount > 0 ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"
                }`}>
                  {phoneDigitCount > 0 ? `📱 ${phoneDigitCount} Digits` : "Enter Phone"}
                </span>
              </label>
              <div className="flex gap-2">
                <div className="relative flex-grow">
                  <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="tel"
                    required
                    maxLength={15}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                    placeholder="e.g. 9876543210"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-sm focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleSendOtp()}
                  disabled={phoneDigitCount === 0}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2 rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap flex items-center gap-1 cursor-pointer"
                >
                  <KeyRound className="h-3.5 w-3.5" />
                  {otpSent ? "Resend OTP" : "Send OTP"}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1 flex items-center justify-between">
                <span>Verification OTP Code</span>
                {aiUpdatedFields.includes("otp") && (
                  <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                    🎙️ Voice Filled
                  </span>
                )}
              </label>
              <div className="relative">
                <ShieldCheck className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  placeholder={generatedOtp ? `Enter ${generatedOtp}` : "Click 'Send OTP' first"}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-sm font-semibold tracking-wider focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || !otpSent}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold p-2.5 rounded-lg text-sm shadow transition flex justify-center items-center space-x-1.5 cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin mr-1.5" />
                  <span>Logging in...</span>
                </>
              ) : (
                <>
                  <span>Verify OTP & Log In</span>
                  <ArrowRight className="h-4 w-4 ml-1.5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-500 border-t border-slate-100 pt-4">
            Don't have an account?{" "}
            <Link href="/signup" className="font-bold text-emerald-600 hover:text-emerald-700">
              Sign Up here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
