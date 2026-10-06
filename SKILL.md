---
name: multilingual-voice-navigator
version: 1.0.0
description: Agent skill for real-time multilingual voice navigation, form slot-filling, and UI state orchestration using open-weight LLMs.
author: Aryan Samadder
license: MIT
compatibility:
  frameworks: ["Next.js", "React", "FastAPI"]
  models: ["Qwen/Qwen2.5", "Qwen/Qwen3.8-27b", "meta-llama/Llama-3.3-70B-Instruct", "openai/whisper-large-v3-turbo"]
---

# Multilingual Voice Navigation & UI Orchestration Agent Skill

An autonomous agent skill enabling voice-driven, passwordless navigation and transaction handling across regional languages (**Bengali**, **Marathi**, and **English**).

## 🧠 Model Architecture & Harness
- **Open-Weight Reasoning Core**: Powered by open-weight LLMs (`Qwen` / `Llama-3.3`) for zero-shot intent classification and slot extraction.
- **Speech-to-Text Pipeline**: Web Speech API with continuous streaming and natural pause debounce (1200ms) + Whisper open-weights fallback.
- **State Machine Integration**: Bidirectional custom DOM events (`custom:form_update`, `custom:send_otp`, `custom:form_state_cleared`) to synchronize UI states with model outputs.

## 🎯 Supported Agent Actions
1. `NAVIGATE`: Contextual portal routing (`/farmer`, `/buyer`, `/transporter`, `/admin`) and internal sub-tab switching (`listings`, `bids`, `deliveries`, `ledger`).
2. `FILL_FORM`: Conversational slot filling for phone numbers, commodity names, quantities, and roles across regional phonemes.
3. `SEND_OTP`: Trigger on-screen 4-digit OTP generation and spoken verification replies.
4. `CHANGE_LANGUAGE`: Live translation and dialect switching across English, Marathi (मराठी), and Bengali (বাংলা).
5. `LOGOUT`: Clean voice session termination and state cache purging.

## 🛠️ Usage Example
```typescript
import { speechClient } from "@/lib/speechClient";

const response = await speechClient.sendCommandToBackend(
  "ওটিপি পাঠাও", // Voice input
  "bn",          // Language mode
  "/login",      // Current route
  "en",          // Preferred language
  "bn",          // Page language
  {},            // Form context
  [],            // Conversation history
  { isLoggedIn: false } // User authentication context
);
// Response returns structured AssistantResponse JSON with intent, action, and response_text.
```
