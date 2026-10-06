"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { SupportedLang } from "../lib/assistantTypes";
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
  brand_title: { en: "KrishiLink", mr: "कृषिलिंक", bn: "কৃষিলিংক" },
  brand_subtitle: { en: "Smart Mandi & Logistics", mr: "स्मार्ट कृषी बाजार आणि वाहतूक", bn: "স্মার্ট মান্ডি ও পরিবহন" },
  page_lang_toggle: { en: "Page Language", mr: "पृष्ठ भाषा", bn: "পৃষ্ঠার ভাষা" },
  
  nav_mandi: { en: "Live Mandi", mr: "थेट कृषी दर", bn: "লাইভ মান্ডি" },
  nav_farmer: { en: "Farmer Hub", mr: "शेतकरी विभाग", bn: "কৃষক হাব" },
  nav_buyer: { en: "Buyer Market", mr: "खरेदीदार बाजार", bn: "ক্রেতা মার্কেট" },
  nav_transporter: { en: "Logistics", mr: "वाहतूक पूल", bn: "পরিবহন" },
  nav_admin: { en: "Admin", mr: "प्रशासक", bn: "অ্যাডমিন" },
  nav_signup: { en: "Register", mr: "नोंदणी करा", bn: "নিবন্ধন" },

  ai_assistant_label: { en: "AI VOICE ASSISTANT", mr: "AI व्हॉइस असिस्टंट", bn: "AI ভয়েস সহকারী" },
  mode_auto: { en: "🌐 Auto", mr: "🌐 स्वयं शोध", bn: "🌐 স্বয়ংক্রিয়" },
  speak_btn: { en: "🎙️ Speak", mr: "🎙️ बोला", bn: "🎙️ বলুন" },
  stop_btn: { en: "🛑 Stop", mr: "🛑 थांबा", bn: "🛑 থামুন" },
  speaking_label: { en: "🗣️ Speaking...", mr: "🗣️ उत्तर देत आहे...", bn: "🗣️ কথা বলছে..." },
  thinking_label: { en: "⏳ Thinking...", mr: "⏳ विचार करत आहे...", bn: "⏳ চিন্তা করছে..." },
  input_placeholder_en: { en: "or type a voice command (e.g. 'go to farmer hub')...", mr: "किंवा येथे लिहा (उदा. 'शेतकरी पृष्ठावर जा')...", bn: "অথবা কমান্ড লিখুন (যেমন 'কৃষক ড্যাশবোর্ডে যাও')..." }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [pageLanguage, setPageLanguageState] = useState<SupportedLang>("en");
  const [userAffinity, setUserAffinity] = useState<UserLanguageAffinity>({ en: 0, mr: 0, bn: 0 });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedPageLang = localStorage.getItem("krishilink_page_lang") as SupportedLang;
      if (savedPageLang && (savedPageLang === "en" || savedPageLang === "mr" || savedPageLang === "bn")) {
        setPageLanguageState(savedPageLang);
      }

      const savedAffinity = localStorage.getItem("krishilink_user_affinity");
      if (savedAffinity) {
        try {
          const parsed = JSON.parse(savedAffinity);
          setUserAffinity({
            en: Number(parsed.en) || 0,
            mr: Number(parsed.mr) || 0,
            bn: Number(parsed.bn) || 0
          });
        } catch (e) {}
      }
    }
  }, []);

  const setPageLanguage = (lang: SupportedLang) => {
    setPageLanguageState(lang);
    if (typeof window !== "undefined") {
      localStorage.setItem("krishilink_page_lang", lang);
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
        localStorage.setItem("krishilink_user_affinity", JSON.stringify(updated));
      }
      return updated;
    });
  };

  let preferredLanguage: SupportedLang = pageLanguage;
  if (userAffinity.bn > userAffinity.en && userAffinity.bn > userAffinity.mr) {
    preferredLanguage = "bn";
  } else if (userAffinity.mr > userAffinity.en && userAffinity.mr > userAffinity.bn) {
    preferredLanguage = "mr";
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
