# 🌾 KrishiLink: Multilingual AI Voice Navigation & Agri-Commerce Platform

> **🏆 Built for Major League Hacking (MLH) — Best Open-Source AI Project Challenge**  
> *An accessibility-first, voice-controlled agritech ecosystem powered by open-weight models: **OpenAI Whisper Large v3** (Speech-to-Text) and **Qwen 2.5 / 3.8** (Multilingual LLM Reasoning).*

[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](https://opensource.org/licenses/MIT)
[![Whisper STT](https://img.shields.io/badge/STT-Whisper%20Large%20v3-orange.svg)](https://github.com/openai/whisper)
[![Qwen LLM](https://img.shields.io/badge/LLM-Qwen%202.5%20%2F%203.8--27B-blue.svg)](https://github.com/QwenLM/Qwen2.5)
[![Next.js 16](https://img.shields.io/badge/Next.js-16.3-black.svg)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL%20%2F%20Neon-336791.svg)](https://neon.tech/)
[![Prisma ORM](https://img.shields.io/badge/ORM-Prisma-2D3748.svg)](https://www.prisma.io/)
[![Groq Inference](https://img.shields.io/badge/Inference-Groq%20LPU-F55036.svg)](https://groq.com/)

---

## 📌 Table of Contents
- [💡 Problem & Mission](#-problem--mission)
- [🤖 Open-Source / Open-Weight AI Architecture](#-open-source--open-weight-ai-architecture)
  - [1. Speech Recognition (STT): OpenAI Whisper Large v3](#1-speech-recognition-stt-openai-whisper-large-v3)
  - [2. Conversational Reasoning & Parsing: Qwen 2.5 / 3.8](#2-conversational-reasoning--parsing-qwen-25--38)
- [🎙️ Voice Assistant Capabilities](#️-voice-assistant-capabilities)
- [🌐 Multi-Dialect Spoken Cheat Sheet](#-multi-dialect-spoken-cheat-sheet)
- [🚜 Platform Modules & User Roles](#-platform-modules--user-roles)
- [🏗️ Technical Architecture](#️-technical-architecture)
- [🚀 Getting Started & Local Development](#-getting-started--local-development)
- [☁️ Cloud Deployment on Vercel](#️-cloud-deployment-on-vercel)
- [📜 License & Standards](#-license--standards)

---

## 💡 Problem & Mission

India is home to over **140 million agricultural producers**, yet a vast majority face steep digital exclusion due to:
- **Complex UI Forms**: Text-heavy dropdowns, filters, and tables that are challenging for semi-literate rural users.
- **Password Barriers**: Cumbersome password recovery, special character rules, and authentication friction.
- **Language Barriers**: Most platforms prioritize English, neglecting regional dialects like **Bengali** and **Marathi**.

**KrishiLink** bridges this accessibility divide through an autonomous, **zero-password, multilingual AI voice navigation system**. Farmers, buyers, and transporters can trade produce, negotiate quotes, and coordinate logistics entirely using their spoken natural language.

---

## 🤖 Open-Source / Open-Weight AI Architecture

KrishiLink combines **OpenAI Whisper Large v3** for speech recognition with **Qwen 2.5 / 3.8** for multi-dialect reasoning and slot-filling:

```
 ┌──────────────────────────────────────────────────────────┐
 │                   Spoken Voice Audio                     │
 │          (English, বাংলা / Bengali, मराठी / Marathi)       │
 └────────────────────────────┬─────────────────────────────┘
                              │
                              ▼
 ┌──────────────────────────────────────────────────────────┐
 │  Speech-to-Text Engine: OpenAI Whisper Large v3 (Groq)   │
 │  • Multilingual Indic phoneme & dialect transcription    │
 │  • Continuous audio streaming with 1200ms debounce       │
 └────────────────────────────┬─────────────────────────────┘
                              │
                              ▼
 ┌──────────────────────────────────────────────────────────┐
 │  Open-Weight Reasoning LLM: Qwen 2.5 / Qwen 3.8-27B      │
 │  • Zero-shot Multilingual Intent Classification          │
 │  • Dialect Script Normalization (বাংলা / मराठी)          │
 │  • Context-Aware Dynamic Slot Filling                    │
 └────────────────────────────┬─────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
 ┌─────────────────────────┐     ┌─────────────────────────┐
 │  Subpage State Machine  │     │   On-Screen OTP Engine  │
 │  (Tabs, Portals, DB)    │     │   (Zero-Password Auth)  │
 └─────────────────────────┘     └─────────────────────────┘
```

### 1. Speech Recognition (STT): OpenAI Whisper Large v3
- **Model**: `openai/whisper-large-v3` / `whisper-large-v3-turbo` via Groq LPU.
- **Where it is used**: [`Voice_Nav/backend/app/services/speech_service.py`](./Voice_Nav/backend/app/services/speech_service.py) and audio ingestion pipeline.
- **Role**: High-precision multilingual audio transcription across noisy rural environments and low-resource Indic speech (Bengali, Marathi, and Hinglish/Banglish).
- **Latency**: Sub-300ms ultra-fast transcription speed.

### 2. Conversational Reasoning & Parsing: Qwen 2.5 / 3.8
- **Model**: `qwen/qwen3.8-27b` / `Qwen2.5`.
- **Where it is used**: [`SIH/src/app/api/assistant/command/route.ts`](./SIH/src/app/api/assistant/command/route.ts) and [`Voice_Nav/backend/app/services/intent_engine.py`](./Voice_Nav/backend/app/services/intent_engine.py).
- **Role**:
  - High-accuracy native script tokenization for Bengali (`বাংলা`) and Devanagari (`मराठी`).
  - Translates regional numeric expressions and glyphs (e.g. `৫ ৮ ২ ৯` or `५ ८ २ ९` -> `5829`) into verified OTP tokens.
  - Contextual intent classification (`NAVIGATE`, `FILL_FORM`, `SEND_OTP`, `CHANGE_LANGUAGE`, `LOGOUT`).

---

## 🎙️ Voice Assistant Capabilities

- **Passwordless Voice Onboarding**: Enter phone number -> say *"Send OTP"* -> visual on-screen OTP code appears -> say *"My OTP is [code]"* -> instantly authenticate.
- **Deep Subpage Tab Switching**: Directly jump to internal sub-tabs like *"My Active Bids"*, *"Secured Contracts"*, *"Produce Listings"*, *"Available Cargo Jobs"*, or *"Escrow Ledger"*.
- **Live Multilingual Translation**: Instant UI dialect switching (`EN | मराठी | বাংলা`) via conversational voice trigger or top-bar control.
- **Voice-Driven Logout**: Say *"Log out"*, *"লগআউট করো"*, or *"लॉग आउट करा"* to cleanly terminate sessions and reset state.

---

## 🌐 Multi-Dialect Spoken Cheat Sheet

| Action | English Voice Command | বাংলা (Bengali) | मराठी (Marathi) |
| :--- | :--- | :--- | :--- |
| **Send OTP** | *"Send OTP"* | *"ওটিপি পাঠাও"* | *"ओटीपी पाठवा"* |
| **Confirm OTP** | *"OTP is 5829"* | *"ওটিপি কোড হলো ৫ ৮ ২ ৯"* | *"माझा ओटीपी ५ ८ २ ९ आहे"* |
| **Farmer Portal** | *"Open Farmer View"* | *"কৃষক পেজে যাও"* | *"शेतकरी पृष्ठावर जा"* |
| **Cargo Jobs** | *"Available cargo jobs"* | *"পরিবহন কাজ দেখাও"* | *"उपलब्ध वाहतूक कामे"* |
| **Active Bids** | *"My active bids"* | *"আমার সক্রিয় দরপত্র"* | *"माझ्या सक्रिय बोली"* |
| **Language Switch**| *"Switch page to Marathi"*| *"পেজের ভাষা বাংলায় পরিবর্তন করো"* | *"पृष्ठ भाषा इंग्रजीत करा"* |
| **Logout** | *"Log me out"* | *"লগআউট করুন"* | *"बाहेर पडा"* |

---

## 🚜 Platform Modules & User Roles

### 🌾 1. Farmer Portal (`/farmer`)
- **Produce Listing Engine**: List crop commodity, variety, weight (quintals), quality grade, and minimum reserve price.
- **Live Mandi Price Integration**: Real-time mandi benchmark rates fetched dynamically via `api.data.gov.in`.
- **Bid Negotiation**: Accept, reject, or counter buyer offers in real time.

### 🛒 2. Buyer Portal (`/buyer`)
- **Produce Discovery**: Search and filter lots by commodity, distance, price range, and seller rating.
- **Escrow-Backed Bids**: Place competitive bids on active lots with transparent platform fee breakdowns.

### 🚛 3. Transporter Portal (`/transporter`)
- **Logistics Matching**: Real-time load matching with support for **Shared (Consolidated)** and **Dedicated** freight modes.
- **Dynamic Freight Bidding**: Submit freight quotes based on per-km rates, vehicle capacity, and estimated ETA.

### 🛠️ 4. Admin Console (`/admin`)
- Platform-wide transaction ledger, user verification, dispute resolution matrix, and reliability scoring.

---

## 🏗️ Technical Architecture

- **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS, Lucide Icons, Recharts.
- **Speech-to-Text (STT)**: **OpenAI Whisper Large v3** (`whisper-large-v3` / `whisper-large-v3-turbo`) via Groq LPU + Web Speech continuous streaming.
- **LLM Reasoning**: **Qwen 2.5 / 3.8-27B** (`qwen/qwen3.8-27b`) for multilingual intent & slot extraction.
- **Database**: PostgreSQL (Serverless via Neon DB) managed with Prisma ORM.
- **Authentication**: Zero-password Phone + On-Screen Dynamic OTP verification.
- **Translation**: Google Translate API + Multilingual React Context (`LanguageContext`).

---

## 🚀 Getting Started & Local Development

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL database instance (or a free [Neon DB](https://neon.tech/) connection)
- Groq API Key ([Get a free key here](https://console.groq.com/))

### 1. Clone Repository
```bash
git clone https://github.com/Aryan-Samadder-07/SIH_voice_Nav.git
cd SIH_voice_Nav/SIH
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env` file in the `SIH/` directory:
```env
DATABASE_URL="postgresql://username:password@host/neondb?sslmode=require"
GROQ_API_KEY="your-groq-api-key"
GROQ_LLM_MODEL="qwen/qwen3.8-27b"
GROQ_WHISPER_MODEL="whisper-large-v3"
DATA_GOV_IN_API_KEY="your-optional-data-gov-in-api-key"
```

### 4. Push Database Schema & Run
```bash
npx prisma db push
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ☁️ Cloud Deployment on Vercel

1. Import the repository `https://github.com/Aryan-Samadder-07/SIH_voice_Nav` on [Vercel](https://vercel.com/).
2. Select **`SIH`** as the project root directory.
3. Add the environment variables (`DATABASE_URL`, `GROQ_API_KEY`, `GROQ_LLM_MODEL`, `DATA_GOV_IN_API_KEY`).
4. Click **Deploy**. Vercel will build and deploy the application with zero additional configuration needed.

---

## 📜 License & Standards

- **License**: Distributed under the **[MIT License](./LICENSE)**.
- **Agent Specification**: Compliant with the **[Agent Skill Open Standard](./SKILL.md)**.
- **Author**: Aryan Samadder ([@Aryan-Samadder-07](https://github.com/Aryan-Samadder-07))
