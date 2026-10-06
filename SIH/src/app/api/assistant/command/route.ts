import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const GROQ_API_KEY = process.env.GROQ_API_KEY || "";
const GROQ_MODEL = process.env.GROQ_LLM_MODEL || "qwen/qwen3.8-27b";

function detectHeuristicLang(text: string): string {
  if (/[\u0980-\u09FF]/.test(text)) return "bn";
  if (/[\u0900-\u097F]/.test(text)) return "mr";
  return "en";
}

export async function POST(req: NextRequest) {
  const startTime = performance.now();
  try {
    const body = await req.json();
    const query = (body.query || body.text || body.transcript || "").trim();
    const langMode = body.language_mode || "auto";
    const currentPath = body.current_path || "/";
    const formContext = body.form_context || {};
    const conversationHistory = body.conversation_history || [];
    const userContext = body.user_context || { isLoggedIn: false };

    const resolvedLang = langMode === "auto" ? detectHeuristicLang(query) : langMode;
    const lowerQuery = query.toLowerCase();

    // 1. Instant Logout Detection
    const logoutKeywords = [
      "log out", "logout", "sign out", "sign me out", "log me out",
      "লগআউট", "লগ আউট", "লগআউট করো", "লগ আউট করো", "লগ আউট করুন", "লগআউট করুন", "সাইন আউট",
      "लॉग आउट", "लॉगआउट", "लॉग आउट करा", "बाहेर पडा"
    ];
    if (logoutKeywords.some(w => lowerQuery === w || lowerQuery.includes(w))) {
      const latency = Math.round(performance.now() - startTime);
      const replyMap: Record<string, string> = {
        bn: "আপনি সফলভাবে লগআউট করেছেন।",
        mr: "आपण यशस्वीरित्या लॉग आउट केले आहे.",
        en: "You have been successfully logged out."
      };
      return NextResponse.json({
        intent: "LOGOUT",
        action: "LOGOUT",
        target_path: "/",
        transcript: query,
        language: resolvedLang,
        detected_language: resolvedLang,
        confidence: 0.99,
        latency_ms: latency,
        response_text: replyMap[resolvedLang] || "You have been successfully logged out."
      });
    }

    // 2. Instant Send OTP Detection
    const otpKeywords = [
      "send otp", "get otp", "resend otp", "generate otp", "send verification", "verify phone",
      "ওটিপি পাঠাও", "ওটিপি দাও", "ওটিপি পাঠান", "ওটিপি জেনারেট করো", "ওটিপি কোড পাঠাও",
      "ओटीपी पाठवा", "ओटीपी द्या", "ओटीपी तयार करा"
    ];
    if (otpKeywords.some(w => lowerQuery === w || lowerQuery.includes(w))) {
      const generatedCode = Math.floor(1000 + Math.random() * 9000).toString();
      const latency = Math.round(performance.now() - startTime);
      const replyMap: Record<string, string> = {
        bn: `আপনার ভেরিফিকেশন ওটিপি হলো ${generatedCode.split("").join(" ")}। অনুগ্রহ করে ওটিপি নিশ্চিত করুন।`,
        mr: `तुमचा सत्यापन ओटीपी ${generatedCode.split("").join(" ")} आहे. कृपया ओटीपी पुष्टी करा.`,
        en: `Your verification OTP is ${generatedCode.split("").join(" ")}. Please confirm your OTP to proceed.`
      };
      return NextResponse.json({
        intent: "SEND_OTP",
        action: "SEND_OTP",
        otp: generatedCode,
        transcript: query,
        language: resolvedLang,
        detected_language: resolvedLang,
        confidence: 0.99,
        latency_ms: latency,
        response_text: replyMap[resolvedLang] || `Your OTP is ${generatedCode}.`
      });
    }

    // 3. Instant Page Language Switch Detection
    const langKeywords = [
      "page language", "website language", "change language", "switch language", "set language",
      "পেজের ভাষা", "পৃষ্ঠার ভাষা", "ওয়েবসাইটের ভাষা", "ভাষা পরিবর্তন", "ভাষা ইংরেজি", "ভাষা বাংলা", "ভাষা মারাঠি",
      "ইংরেজিতে পরিবর্তন", "বাংলায় পরিবর্তন", "মারাঠিতে পরিবর্তন",
      "পৃষ্ঠ भाषा", "पेज भाषा", "भाषा बदला", "भाषा इंग्रजी", "भाषा मराठी", "भाषा बंगाली",
      "इंग्रजीत करा", "मराठीत करा", "बंगालीत करा"
    ];

    if (langKeywords.some(w => lowerQuery.includes(w)) || 
       ((lowerQuery.includes("language") || lowerQuery.includes("ভাষা") || lowerQuery.includes("भाषा")) && 
        ["en", "english", "mr", "marathi", "bn", "bengali", "bangla", "ইংরেজি", "বাংলা", "মারাঠি", "इंग्रजी", "मराठी"].some(l => lowerQuery.includes(l)))) {
      let targetLang = "en";
      if (["bangla", "bengali", "বাংলা", "বাঙলা", "बंगाلی", "বংলা", "bn"].some(l => lowerQuery.includes(l))) {
        targetLang = "bn";
      } else if (["marathi", "मराठी", "মারাঠি", "mr"].some(l => lowerQuery.includes(l))) {
        targetLang = "mr";
      } else if (["english", "ইংরেজি", "इंग्रजी", "en", "eng"].some(l => lowerQuery.includes(l))) {
        targetLang = "en";
      }

      const latency = Math.round(performance.now() - startTime);
      const replyMap: Record<string, string> = {
        bn: targetLang === "en" ? "পেজের ভাষা ইংরেজিতে পরিবর্তন করা হয়েছে।" : targetLang === "mr" ? "পেজের ভাষা মারাঠিতে পরিবর্তন করা হয়েছে।" : "পেজের ভাষা বাংলায় পরিবর্তন করা হয়েছে।",
        mr: targetLang === "en" ? "पृष्ठ भाषा इंग्रजीमध्ये बदलली आहे." : targetLang === "mr" ? "पृष्ठ भाषा मराठीमध्ये बदलली आहे." : "पृष्ठ भाषा बंगालीमध्ये बदलली आहे.",
        en: `Page language changed to ${targetLang === "en" ? "English" : targetLang === "mr" ? "Marathi" : "Bengali"}.`
      };

      return NextResponse.json({
        intent: "CHANGE_LANGUAGE",
        action: "CHANGE_LANGUAGE",
        target_language: targetLang,
        transcript: query,
        language: resolvedLang,
        detected_language: resolvedLang,
        confidence: 0.99,
        latency_ms: latency,
        response_text: replyMap[resolvedLang] || `Page language updated to ${targetLang}.`
      });
    }

    // 4. Load route catalog
    const catalogPath = path.join(process.cwd(), "src", "data", "training_intents.json");
    let routesData: any[] = [];
    try {
      if (fs.existsSync(catalogPath)) {
        routesData = JSON.parse(fs.readFileSync(catalogPath, "utf-8"));
      }
    } catch (e) {}

    // Exact Navigation match
    for (const r of routesData) {
      const allUtterances = [
        ...(r.utterances_en || []),
        ...(r.utterances_mr || []),
        ...(r.utterances_bn || [])
      ].map(u => u.toLowerCase());

      if (allUtterances.some(u => lowerQuery === u || (lowerQuery.length > 3 && u === lowerQuery))) {
        const latency = Math.round(performance.now() - startTime);
        const navReply = resolvedLang === "bn"
          ? `${r.name_bn} বিভাগে নিয়ে যাওয়া হচ্ছে।`
          : resolvedLang === "mr"
          ? `${r.name_mr} पृष्ठावर नेत आहे.`
          : `Navigating to ${r.name_en}.`;

        return NextResponse.json({
          intent: "NAVIGATE",
          action: "NAVIGATE",
          target_path: r.path,
          target_tab: r.tab || null,
          target_route_id: r.route_id,
          transcript: query,
          language: resolvedLang,
          detected_language: resolvedLang,
          confidence: 0.99,
          latency_ms: latency,
          response_text: navReply
        });
      }
    }

    // 5. Classify with Live Groq AI
    if (GROQ_API_KEY) {
      const isLoginPage = currentPath === "/login" || lowerQuery.includes("login") || lowerQuery.includes("log in") || lowerQuery.includes("লগইন") || lowerQuery.includes("लॉगिन");

      const routesCompact = routesData.map(r => ({
        id: r.route_id,
        path: r.path,
        tab: r.tab || null,
        name: `${r.name_en} / ${r.name_mr} / ${r.name_bn}`
      }));

      const systemPrompt = `You are the Multilingual AI Voice Assistant for KrishiLink.
Current Route: ${currentPath}, User Logged In: ${userContext.isLoggedIn ? `YES (Role: ${userContext.role}, Name: ${userContext.name})` : "NO"}, Form Context: ${JSON.stringify(formContext)}, Detected Lang: ${resolvedLang}
Available Navigation Routes & Subpages: ${JSON.stringify(routesCompact)}

IMPORTANT CONTEXT RULES:
- User is Authenticated: ${userContext.isLoggedIn ? "TRUE. The user is ALREADY logged in. DO NOT redirect to login/signup or ask for phone/role. If user says 'Transporter', 'Farmer', 'Buyer', 'Admin', 'Dashboard', navigate to the respective portal (intent=NAVIGATE)." : "FALSE. User is a guest."}
- Navigation: If user asks for any view ("Transporter", "Transporter view", "Farmer view", "Buyer", "Admin console", "My bids", "List produce"), set intent="NAVIGATE" to the matching path/tab.
- OTP & Form Filling: ONLY active when user is NOT logged in or explicitly requesting OTP verification on /login or /signup.
- Logout: "Log out", "লগআউট", "लॉग आउट" => intent="LOGOUT", action="LOGOUT".

Return JSON ONLY:
{
  "intent": "NAVIGATE" | "FILL_FORM" | "SUBMIT_FORM" | "CLEAR_FORM" | "CHANGE_LANGUAGE" | "LOGOUT" | "SEND_OTP" | "QUESTION" | "UNKNOWN",
  "action": "NAVIGATE" | "FILL_FORM" | "SUBMIT_FORM" | "CLEAR_FORM" | "CHANGE_LANGUAGE" | "LOGOUT" | "SEND_OTP" | "NONE",
  "detected_language": "en" | "mr" | "bn",
  "target_language": "en" | "mr" | "bn" | null,
  "target_route_id": "<id or null>",
  "target_path": "<'/login' | '/signup' | '/buyer' | '/farmer' | '/transporter' | '/admin' | '/' | null>",
  "target_tab": "<tab or null>",
  "slots": {"name": null, "phone": null, "otp": null, "role": null, "state": null, "district": null},
  "phone_status": "complete" | "partial" | "excess_digits" | "none",
  "reply_text": "<natural spoken response in detected language>",
  "confidence": 0.98
}`;

      const messages: any[] = [{ role: "system", content: systemPrompt }];
      if (conversationHistory.length > 0) {
        for (const item of conversationHistory.slice(-6)) {
          messages.push({
            role: item.role === "assistant" ? "assistant" : "user",
            content: String(item.text || "")
          });
        }
      }
      messages.push({ role: "user", content: `User speech: ${query}` });

      const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages,
          temperature: 0.1,
          max_tokens: 280,
          response_format: { type: "json_object" }
        })
      });

      if (groqRes.ok) {
        const groqData = await groqRes.json();
        const content = groqData.choices[0]?.message?.content;
        const parsed = JSON.parse(content);

        const latency = Math.round(performance.now() - startTime);
        const aiIntent = (parsed.intent || "UNKNOWN").toUpperCase();

        if (aiIntent === "SEND_OTP" || parsed.action === "SEND_OTP") {
          const generatedCode = Math.floor(1000 + Math.random() * 9000).toString();
          return NextResponse.json({
            intent: "SEND_OTP",
            action: "SEND_OTP",
            otp: generatedCode,
            transcript: query,
            language: parsed.detected_language || resolvedLang,
            detected_language: parsed.detected_language || resolvedLang,
            confidence: 0.99,
            latency_ms: latency,
            response_text: parsed.reply_text || `Verification code is ${generatedCode}. Please confirm your OTP.`
          });
        }

        if (aiIntent === "LOGOUT" || parsed.action === "LOGOUT") {
          return NextResponse.json({
            intent: "LOGOUT",
            action: "LOGOUT",
            target_path: "/",
            transcript: query,
            language: parsed.detected_language || resolvedLang,
            detected_language: parsed.detected_language || resolvedLang,
            confidence: 0.99,
            latency_ms: latency,
            response_text: parsed.reply_text || (resolvedLang === "bn" ? "আপনি সফলভাবে লগআউট করেছেন।" : resolvedLang === "mr" ? "आपण यशस्वीरित्या लॉग आउट केले आहे." : "You have been successfully logged out.")
          });
        }

        if (aiIntent === "NAVIGATE" && parsed.target_path) {
          return NextResponse.json({
            intent: "NAVIGATE",
            action: "NAVIGATE",
            target_path: parsed.target_path,
            target_tab: parsed.target_tab || null,
            target_route_id: parsed.target_route_id,
            transcript: query,
            language: parsed.detected_language || resolvedLang,
            detected_language: parsed.detected_language || resolvedLang,
            confidence: parsed.confidence || 0.98,
            latency_ms: latency,
            response_text: parsed.reply_text || `Opening ${parsed.target_tab || parsed.target_path}.`
          });
        }

        if (aiIntent === "FILL_FORM") {
          const slots = parsed.slots || {};
          const cleanSlots: Record<string, any> = {};
          for (const [k, v] of Object.entries(slots)) {
            if (v !== null && v !== undefined) cleanSlots[k] = v;
          }

          let targetPath = parsed.target_path;
          if (!targetPath) {
            targetPath = currentPath === "/login" ? "/login" : "/signup";
          }

          return NextResponse.json({
            intent: "FILL_FORM",
            action: "FILL_FORM",
            transcript: query,
            language: parsed.detected_language || resolvedLang,
            detected_language: parsed.detected_language || resolvedLang,
            target_path: targetPath,
            form_data: cleanSlots,
            phone_status: parsed.phone_status || "none",
            confidence: parsed.confidence || 0.98,
            latency_ms: latency,
            response_text: parsed.reply_text || "Details updated."
          });
        }

        if (aiIntent === "SUBMIT_FORM") {
          return NextResponse.json({
            intent: "SUBMIT_FORM",
            action: "SUBMIT_FORM",
            target_path: currentPath === "/login" ? "/login" : "/signup",
            transcript: query,
            language: parsed.detected_language || resolvedLang,
            detected_language: parsed.detected_language || resolvedLang,
            confidence: 0.98,
            latency_ms: latency,
            response_text: parsed.reply_text || (currentPath === "/login" ? "Verifying OTP and logging in..." : "Confirming OTP and completing registration...")
          });
        }

        if (aiIntent === "CHANGE_LANGUAGE" || parsed.action === "CHANGE_LANGUAGE") {
          return NextResponse.json({
            intent: "CHANGE_LANGUAGE",
            action: "CHANGE_LANGUAGE",
            target_language: parsed.target_language || "en",
            transcript: query,
            language: parsed.detected_language || resolvedLang,
            detected_language: parsed.detected_language || resolvedLang,
            confidence: 0.98,
            latency_ms: latency,
            response_text: parsed.reply_text || "Page language updated."
          });
        }

        return NextResponse.json({
          intent: aiIntent,
          action: parsed.action || "NONE",
          transcript: query,
          language: parsed.detected_language || resolvedLang,
          detected_language: parsed.detected_language || resolvedLang,
          target_path: parsed.target_path || null,
          target_tab: parsed.target_tab || null,
          confidence: parsed.confidence || 0.95,
          latency_ms: latency,
          response_text: parsed.reply_text || "Understood."
        });
      }
    }

    const latency = Math.round(performance.now() - startTime);
    return NextResponse.json({
      intent: "UNKNOWN",
      action: "NONE",
      transcript: query,
      language: resolvedLang,
      detected_language: resolvedLang,
      confidence: 0.5,
      latency_ms: latency,
      response_text: resolvedLang === "bn" ? "আমি আপনার অনুরোধটি বুঝতে পারিনি। দয়া করে আবার বলুন।" : resolvedLang === "mr" ? "मला तुमची विनंती समजली नाही. कृपया पुन्हा सांगा." : "I didn't quite catch that. Please try again."
    });
  } catch (err: any) {
    return NextResponse.json({
      intent: "UNKNOWN",
      action: "NONE",
      error: err.message || "Failed to process command",
      confidence: 0.0
    }, { status: 500 });
  }
}
