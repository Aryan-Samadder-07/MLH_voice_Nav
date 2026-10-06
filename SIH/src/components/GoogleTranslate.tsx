"use client";

import React, { useEffect } from "react";
import Script from "next/script";

declare global {
  interface Window {
    google?: any;
    googleTranslateElementInit?: () => void;
  }
}

export const GoogleTranslate: React.FC = () => {
  useEffect(() => {
    window.googleTranslateElementInit = () => {
      if (window.google?.translate?.TranslateElement) {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: "en",
            includedLanguages: "en,bn,mr,hi,ta,te,gu,kn,ml,pa,ur",
            autoDisplay: false
          },
          "google_translate_element"
        );
      }
    };

    const styleEl = document.createElement("style");
    styleEl.innerHTML = `
      .goog-te-banner-frame,
      .goog-te-banner-frame.skiptranslate,
      iframe.goog-te-banner-frame,
      iframe[id^=":"],
      iframe[class*="goog-te-banner"],
      iframe[class*="VIpgJd"],
      .VIpgJd-ZVi9od-aZ2wEe-wOHMyf,
      .VIpgJd-ZVi9od-ORHb-Oxf5Fd,
      .VIpgJd-ZVi9od-l4eHX-hSRGPd,
      div[class*="VIpgJd"],
      body > iframe {
        display: none !important;
        visibility: hidden !important;
        height: 0px !important;
        width: 0px !important;
        opacity: 0 !important;
        position: absolute !important;
        top: -9999px !important;
        left: -9999px !important;
        pointer-events: none !important;
        z-index: -99999 !important;
      }
      body {
        top: 0px !important;
        position: static !important;
        margin-top: 0px !important;
      }
      #goog-gt-tt, .goog-te-balloon-frame, .goog-tooltip, .goog-text-highlight {
        display: none !important;
      }
    `;
    document.head.appendChild(styleEl);

    const enforceHiddenBanner = () => {
      if (document.body) {
        if (document.body.style.top && document.body.style.top !== "0px") {
          document.body.style.top = "0px";
        }
        if (document.body.style.marginTop && document.body.style.marginTop !== "0px") {
          document.body.style.marginTop = "0px";
        }
      }
      const iframes = document.querySelectorAll<HTMLElement>(
        "iframe.goog-te-banner-frame, .goog-te-banner-frame, iframe[id^=':'], body > iframe, .skiptranslate iframe, iframe[src*='translate'], [class*='goog-te-banner'], [class*='VIpgJd']"
      );
      iframes.forEach((iframe) => {
        iframe.style.setProperty("display", "none", "important");
        iframe.style.setProperty("visibility", "hidden", "important");
      });
    };

    enforceHiddenBanner();
    const observer = new MutationObserver(enforceHiddenBanner);
    observer.observe(document.documentElement, { attributes: true, childList: true, subtree: true });

    return () => {
      observer.disconnect();
      if (styleEl.parentNode) styleEl.parentNode.removeChild(styleEl);
    };
  }, []);

  return (
    <>
      <div
        id="google_translate_element"
        style={{
          position: "absolute",
          top: "-9999px",
          left: "-9999px",
          opacity: 0,
          pointerEvents: "none"
        }}
      />
      <Script
        src="https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
        strategy="afterInteractive"
      />
    </>
  );
};

export const triggerGoogleTranslate = (langCode: string) => {
  if (typeof window === "undefined") return;

  const targetLang = langCode === "en" ? "/auto/en" : `/auto/${langCode}`;
  
  document.cookie = `googtrans=${targetLang}; path=/;`;
  document.cookie = `googtrans=${targetLang}; path=/; domain=${window.location.hostname};`;
  document.cookie = `googtrans=${targetLang}; path=/; domain=.${window.location.hostname};`;

  if (langCode === "en") {
    document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`;
  }

  const applyToSelect = (el: HTMLSelectElement) => {
    let optionExists = false;
    for (let i = 0; i < el.options.length; i++) {
      if (el.options[i].value === langCode) {
        el.selectedIndex = i;
        optionExists = true;
        break;
      }
    }
    if (!optionExists && langCode === "en") {
      el.selectedIndex = 0;
    }
    el.dispatchEvent(new Event("change"));
    el.dispatchEvent(new Event("input"));
  };

  const selectElem = document.querySelector<HTMLSelectElement>(".goog-te-combo");
  if (selectElem) {
    applyToSelect(selectElem);
  } else {
    let attempts = 0;
    const retryInterval = setInterval(() => {
      attempts++;
      const el = document.querySelector<HTMLSelectElement>(".goog-te-combo");
      if (el) {
        applyToSelect(el);
        clearInterval(retryInterval);
      } else if (attempts >= 10) {
        clearInterval(retryInterval);
      }
    }, 200);
  }
};
