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
            includedLanguages: "en,bn,mr,hi,ta,te,gu,kn,ml,pa,ur,es,fr,de,ja,zh-CN",
            autoDisplay: false
          },
          "google_translate_element"
        );
      }
    };

    // Inject dedicated hard override styles directly into head
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
        max-height: 0px !important;
        max-width: 0px !important;
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
        transform: none !important;
      }
      #goog-gt-tt, .goog-te-balloon-frame, .goog-tooltip, .goog-text-highlight {
        display: none !important;
      }
    `;
    document.head.appendChild(styleEl);

    // MutationObserver to continuously kill banner iframe and keep body.style.top = 0px
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
        iframe.style.setProperty("height", "0px", "important");
        iframe.style.setProperty("width", "0px", "important");
        iframe.style.setProperty("position", "absolute", "important");
        iframe.style.setProperty("top", "-9999px", "important");
        iframe.style.setProperty("left", "-9999px", "important");
        iframe.style.setProperty("pointer-events", "none", "important");
        iframe.style.setProperty("z-index", "-99999", "important");
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

/**
 * Programmatically triggers Google Translate for the entire page
 */
export const triggerGoogleTranslate = (langCode: string) => {
  if (typeof window === "undefined") return;

  const targetLang = langCode === "en" ? "/auto/en" : `/auto/${langCode}`;
  
  // Set translation cookies for path and domain
  document.cookie = `googtrans=${targetLang}; path=/;`;
  document.cookie = `googtrans=${targetLang}; path=/; domain=${window.location.hostname};`;
  document.cookie = `googtrans=${targetLang}; path=/; domain=.${window.location.hostname};`;

  if (langCode === "en") {
    // Also clear cookie to ensure default English original text resets
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

  // Update Google Translate select element if initialized
  const selectElem = document.querySelector<HTMLSelectElement>(".goog-te-combo");
  if (selectElem) {
    applyToSelect(selectElem);
  } else {
    // Retry shortly if the element is being initialized
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

