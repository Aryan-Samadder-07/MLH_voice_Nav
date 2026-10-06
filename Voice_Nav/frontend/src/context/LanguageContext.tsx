"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { SupportedLang } from "../lib/types";
import { triggerGoogleTranslate } from "../components/GoogleTranslate";

export interface UserLanguageAffinity {
  en: number;
  mr: number;
  bn: number;
}

interface LanguageContextType {
  pageLanguage: SupportedLang;
  setPageLanguage: (lang: SupportedLang) => void;
  userAffinity: UserLanguageAffinity;
  preferredLanguage: SupportedLang;
  recordLanguageUsage: (lang: string) => void;
  t: (key: string) => string;
}

const DICTIONARY: Record<string, { en: string; mr: string; bn: string }> = {
  // Brand & Header
  brand_title: { en: "VoiceNav AI", mr: "व्हॉईस-नॅव्ह AI", bn: "ভয়েস-ন্যাভ AI" },
  brand_subtitle: { en: "Multilingual AI Assistant", mr: "बहुभाषिक AI सहाय्यक", bn: "বহুভাষিক AI সহকারী" },
  page_lang_toggle: { en: "Page Language", mr: "पृष्ठ भाषा", bn: "পৃষ্ঠার ভাষা" },
  
  // Navigation Routes
  nav_dashboard: { en: "Dashboard", mr: "डॅशबोर्ड", bn: "ড্যাশবোর্ড" },
  nav_analytics: { en: "Analytics", mr: "ॲनालिटिक्स", bn: "অ্যানালিটিক্স" },
  nav_profile: { en: "Profile", mr: "माझे प्रोफाईल", bn: "প্রোফাইল" },
  nav_settings: { en: "Settings", mr: "सेटिंग्ज", bn: "সেটিংস" },
  nav_diagnostics: { en: "Diagnostics", mr: "निदान आणि चाचणी", bn: "ডায়াগনস্টিকস" },
  nav_help: { en: "Help & Support", mr: "मदत आणि सहाय्य", bn: "সাহায্য ও সহায়তা" },

  // Dashboard Page
  demo_tag: { en: "Mini Project Demo", mr: "मिनी प्रोजेक्ट डेमो", bn: "মিনি প্রজেক্ট ডেমো" },
  dashboard_title: { en: "Dashboard", mr: "डॅशबोर्ड", bn: "ড্যাশবোর্ড" },
  dashboard_subtitle: {
    en: "Speak naturally in your preferred language to navigate anywhere instantly.",
    mr: "त्वरित नेव्हिगेट करण्यासाठी आपल्या पसंतीच्या भाषेत बोला.",
    bn: "তাত্ক্ষণিকভাবে যেকোনো পৃষ্ঠায় যেতে আপনার পছন্দের ভাষায় কথা বলুন।"
  },
  voice_commands_title: { en: "Voice Commands to Try Right Now:", mr: "आता वापरून पाहण्यासाठी आवाज आदेश:", bn: "এখনই চেষ্টা করার মতো ভয়েস কমান্ড:" },
  english_commands: { en: "English Commands:", mr: "इंग्रजी आदेश:", bn: "ইংরেজি কমান্ড:" },
  marathi_commands: { en: "Marathi Commands:", mr: "मराठी आदेश:", bn: "মারাঠি কমান্ড:" },
  bengali_commands: { en: "Bengali Commands:", mr: "বাংলা आदेश:", bn: "বাংলা কমান্ড:" },
  available_routes: { en: "Available Demo Routes", mr: "उपलब्ध डेमो पृष्ठे", bn: "উপলব্ধ ডেমো পেজ" },
  view_page: { en: "View Page →", mr: "पृष्ठ पहा →", bn: "পৃষ্ঠা দেখুন →" },

  // Assistant Bar
  ai_assistant_label: { en: "AI VOICE ASSISTANT", mr: "AI व्हॉइस असिस्टंट", bn: "AI ভয়েস সহকারী" },
  mode_auto: { en: "🌐 Auto", mr: "🌐 स्वयं शोध", bn: "🌐 স্বয়ংক্রিয়" },
  mode_en: { en: "EN", mr: "EN", bn: "EN" },
  mode_mr: { en: "मराठी", mr: "मराठी", bn: "मराठी" },
  mode_bn: { en: "বাংলা", mr: "বাংলা", bn: "বাংলা" },
  speak_btn: { en: "🎙️ Speak", mr: "🎙️ बोला", bn: "🎙️ বলুন" },
  stop_btn: { en: "🛑 Stop", mr: "🛑 थांबा", bn: "🛑 থামুন" },
  speaking_label: { en: "🗣️ Speaking...", mr: "🗣️ उत्तर देत आहे...", bn: "🗣️ কথা বলছে..." },
  thinking_label: { en: "⏳ Thinking...", mr: "⏳ विचार करत आहे...", bn: "⏳ চিন্তা করছে..." },
  input_placeholder_en: { en: "or type a command (e.g. 'go to settings')...", mr: "किंवा येथे लिहा (उदा. 'सेटिंग्ज दाखवा')...", bn: "অথবা কমান্ড লিখুন (যেমন 'সেটিংস দেখাও')..." },
  input_placeholder_mr: { en: "किंवा येथे मराठीत टाइप करा...", mr: "किंवा येथे मराठीत टाइप करा...", bn: "किंवा येथे मराठीत टाइप करा..." },
  input_placeholder_bn: { en: "অথবা এখানে বাংলায় লিখুন...", mr: "অথবা এখানে বাংলায় লিখুন...", bn: "অথবা এখানে বাংলায় লিখুন..." },
  send_btn: { en: "Send", mr: "पाठवा", bn: "পাঠান" },
  train_btn: { en: "🎓 Train Intents", mr: "🎓 ट्रेन इंटेंट्स", bn: "🎓 ট্রেন ইনটেন্ট" },
  transcript_label: { en: "Transcript (STT):", mr: "ध्वनी रूपांतर (STT):", bn: "শ্রুতিলিপি (STT):" },
  assistant_label: { en: "Assistant:", mr: "सहाय्यक:", bn: "সহকারী:" },
  listening_hint_en: { en: "Click 'Speak' and give a voice command...", mr: "बोलण्यासाठी 'Speak' वर क्लिक करा...", bn: "ভয়েস কমান্ড দিতে 'বলুন' এ ক্লিক করুন..." },
  listening_hint_mr: { en: "आवाज ऐकण्यासाठी 'Speak' वर क्लिक करा...", mr: "आवाज ऐकण्यासाठी 'Speak' वर क्लिक करा...", bn: "ভয়েস কমান্ড দিতে 'বলুন' এ ক্লিক করুন..." },
  listening_hint_bn: { en: "ভয়েস কমান্ড দিতে 'বলুন' এ ক্লিক করুন...", mr: "ভয়েস কমান্ড দিতে 'বলুন' এ ক্লিক করুন...", bn: "ভয়েস কমান্ড দিতে 'বলুন' এ ক্লিক করুন..." },
  affinity_badge: { en: "Learned User Preference:", mr: "शिकलेली भाषा पसंती:", bn: "শেখা ভাষা পছন্দ:" },
  auto_detected_badge: { en: "Auto Detected:", mr: "शोधलेली भाषा:", bn: "চিহ্নিত ভাষা:" }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [pageLanguage, setPageLanguageState] = useState<SupportedLang>("en");
  const [userAffinity, setUserAffinity] = useState<UserLanguageAffinity>({ en: 0, mr: 0, bn: 0 });

  // Load persisted language and affinity on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedPageLang = localStorage.getItem("voicenav_page_lang") as SupportedLang;
      if (savedPageLang && (savedPageLang === "en" || savedPageLang === "mr" || savedPageLang === "bn")) {
        setPageLanguageState(savedPageLang);
      }

      const savedAffinity = localStorage.getItem("voicenav_user_affinity");
      if (savedAffinity) {
        try {
          const parsed = JSON.parse(savedAffinity);
          setUserAffinity({
            en: Number(parsed.en) || 0,
            mr: Number(parsed.mr) || 0,
            bn: Number(parsed.bn) || 0
          });
        } catch (e) {
          console.warn("Error parsing user affinity:", e);
        }
      }
    }
  }, []);

  const setPageLanguage = (lang: SupportedLang) => {
    setPageLanguageState(lang);
    if (typeof window !== "undefined") {
      localStorage.setItem("voicenav_page_lang", lang);
      triggerGoogleTranslate(lang);
    }
  };

  const recordLanguageUsage = (lang: string) => {
    const l = (lang || "").toLowerCase();
    let cleanLang: SupportedLang = "en";
    if (l.startsWith("bn")) cleanLang = "bn";
    else if (l.startsWith("mr")) cleanLang = "mr";

    setUserAffinity((prev) => {
      const updated = {
        ...prev,
        [cleanLang]: (prev[cleanLang] || 0) + 1
      };
      if (typeof window !== "undefined") {
        localStorage.setItem("voicenav_user_affinity", JSON.stringify(updated));
      }
      return updated;
    });
  };

  // Derive preferred language from affinity counts or fallback to pageLanguage
  let preferredLanguage: SupportedLang = pageLanguage;
  if (userAffinity.bn > userAffinity.en && userAffinity.bn > userAffinity.mr) {
    preferredLanguage = "bn";
  } else if (userAffinity.mr > userAffinity.en && userAffinity.mr > userAffinity.bn) {
    preferredLanguage = "mr";
  } else if (userAffinity.en > 0 && userAffinity.en >= userAffinity.mr && userAffinity.en >= userAffinity.bn) {
    preferredLanguage = "en";
  }

  const t = (key: string): string => {
    const item = DICTIONARY[key];
    if (!item) return key;
    return item[pageLanguage] || item.en || key;
  };

  return (
    <LanguageContext.Provider
      value={{
        pageLanguage,
        setPageLanguage,
        userAffinity,
        preferredLanguage,
        recordLanguageUsage,
        t
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
