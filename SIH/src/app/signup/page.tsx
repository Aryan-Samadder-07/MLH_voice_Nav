"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import { Leaf, Phone, User as UserIcon, Globe, ArrowRight, RefreshCw, ShieldCheck, MapPin, KeyRound, Sparkles } from "lucide-react";
import GPSLocationPicker from "@/components/GPSLocationPicker";

export default function SignupPage() {
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

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    otp: "",
    role: "FARMER",
    state: "Maharashtra",
    district: "Nashik",
    latitude: "" as number | string,
    longitude: "" as number | string
  });

  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiUpdatedFields, setAiUpdatedFields] = useState<string[]>([]);

  // Generate random 4-digit OTP for signup verification
  const handleSendOtp = (customCode?: string) => {
    const cleanPhone = formData.phone.trim().replace(/\D/g, "");
    if (!cleanPhone) {
      setError("Please enter a phone number before requesting an OTP.");
      return;
    }
    setError(null);

    const code = customCode || Math.floor(1000 + Math.random() * 9000).toString();
    setGeneratedOtp(code);
    setOtpSent(true);
  };

  // Broadcast form state to Voice Assistant
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("custom:form_state_changed", {
        detail: { ...formData, page: "signup", otpSent, generatedOtp }
      })
    );
  }, [formData, otpSent, generatedOtp]);

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
          next.phone = String(incoming.phone).replace(/\D/g, "");
          updatedKeys.push("phone");
        }
        if (incoming.otp !== undefined && incoming.otp !== null) {
          next.otp = String(incoming.otp).replace(/\D/g, "");
          updatedKeys.push("otp");
        }
        if (incoming.role !== undefined && incoming.role !== null) {
          const r = String(incoming.role).toUpperCase();
          if (["FARMER", "BUYER", "TRANSPORTER", "ADMIN"].includes(r)) {
            next.role = r;
            updatedKeys.push("role");
          }
        }
        if (incoming.state !== undefined && incoming.state !== null) {
          next.state = incoming.state;
          updatedKeys.push("state");
        }
        if (incoming.district !== undefined && incoming.district !== null) {
          next.district = incoming.district;
          updatedKeys.push("district");
        } else if (incoming.village !== undefined && incoming.village !== null) {
          next.district = incoming.village;
          updatedKeys.push("district");
        }
        return next;
      });

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
      setFormData({
        name: "",
        phone: "",
        otp: "",
        role: "FARMER",
        state: "Maharashtra",
        district: "Nashik",
        latitude: "",
        longitude: ""
      });
      setGeneratedOtp(null);
      setOtpSent(false);
      setAiUpdatedFields([]);
      setError(null);
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
  }, [formData, generatedOtp]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError("Please enter your name.");
      return;
    }
    const cleanPhone = formData.phone.trim().replace(/\D/g, "");
    if (!cleanPhone) {
      setError("Please enter a phone number.");
      return;
    }
    if (!otpSent || !generatedOtp) {
      setError("Please click 'Send OTP' to verify your mobile number.");
      return;
    }
    if (!formData.otp.trim() || formData.otp.trim() !== generatedOtp) {
      setError(`Invalid OTP. Please enter the ${generatedOtp} verification code shown above.`);
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
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
        setError(data.error || "Signup failed");
      }
    } catch (err) {
      console.error("Signup error:", err);
      setError("An unexpected network error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  const phoneDigitCount = (formData.phone || "").replace(/\D/g, "").length;

  return (
    <div className="min-h-[85vh] flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-slate-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-emerald-100 text-emerald-600 mb-3">
          <Leaf className="h-7 w-7 fill-emerald-100" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Create your KrishiLink Account
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Instant OTP Verification & Hands-free AI Voice Onboarding!
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm sm:rounded-xl sm:px-10 border border-slate-200">
          
          {/* Prominent On-Screen OTP Banner */}
          {generatedOtp && (
            <div className="mb-5 bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-300 p-4 rounded-xl shadow-xs">
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
                  onClick={() => setFormData({ ...formData, otp: generatedOtp })}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-100 hover:bg-emerald-200 px-3 py-2 rounded-lg transition"
                >
                  Auto-fill OTP
                </button>
              </div>
              <p className="text-[11px] text-emerald-700 mt-2">
                Say <span className="font-bold underline">"OTP is {generatedOtp}"</span> or enter it below.
              </p>
            </div>
          )}

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-lg flex items-center gap-2">
              <span className="font-bold">Error:</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>Full Name</span>
                {aiUpdatedFields.includes("name") && (
                  <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                    🎙️ Voice Filled
                  </span>
                )}
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Ramesh Patil / রমেশ"
                  className="pl-9 w-full rounded-lg border border-slate-300 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center justify-between">
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
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, "") })}
                    placeholder="Mobile / Phone number"
                    className="pl-9 w-full rounded-lg border border-slate-300 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
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
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>Verification OTP</span>
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
                  value={formData.otp}
                  onChange={(e) => setFormData({ ...formData, otp: e.target.value.replace(/\D/g, "") })}
                  placeholder={generatedOtp ? `Enter ${generatedOtp}` : "Click 'Send OTP' first"}
                  className="pl-9 w-full rounded-lg border border-slate-300 py-2 text-sm font-semibold tracking-wider focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Select Platform Role
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "FARMER", label: "Farmer / কৃষক" },
                  { id: "BUYER", label: "Buyer / ক্রেতা" },
                  { id: "TRANSPORTER", label: "Transporter / পরিবহন" }
                ].map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, role: r.id })}
                    className={`py-2 px-1 text-xs font-bold rounded-lg border text-center transition ${
                      formData.role === r.id
                        ? "bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm ring-1 ring-emerald-500"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  State
                </label>
                <input
                  type="text"
                  required
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  placeholder="State name"
                  className="w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  District / Town
                </label>
                <input
                  type="text"
                  required
                  value={formData.district}
                  onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                  placeholder="District / Town"
                  className="w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || !otpSent}
              className="w-full mt-4 flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition disabled:opacity-50 cursor-pointer"
            >
              {submitting ? (
                <>
                  <RefreshCw className="animate-spin h-4 w-4 mr-2" />
                  Creating Account...
                </>
              ) : (
                <>
                  Confirm OTP & Register <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-500 border-t border-slate-100 pt-4">
            Already registered?{" "}
            <Link href="/login" className="font-bold text-emerald-600 hover:text-emerald-700">
              Log in here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
