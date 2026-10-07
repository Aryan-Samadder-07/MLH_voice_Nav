# 🌾 KrishiLink: Multilingual AI Voice Navigation & Agri-Commerce Platform

> **🏆 Built for Major League Hacking (MLH) — Best Open-Source AI Project Challenge**  
> *An accessibility-first, voice-controlled agritech ecosystem powered by open-weight LLMs (`Qwen` & `Llama-3`) and open-source speech processing.*

[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](https://opensource.org/licenses/MIT)
[![Open-Weight AI](https://img.shields.io/badge/AI-Open--Weight%20LLMs-blue.svg)](https://github.com/QwenLM/Qwen2.5)
[![Next.js 16](https://img.shields.io/badge/Next.js-16.3-black.svg)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL%20%2F%20Neon-336791.svg)](https://neon.tech/)
[![Prisma ORM](https://img.shields.io/badge/ORM-Prisma-2D3748.svg)](https://www.prisma.io/)
[![Groq Inference](https://img.shields.io/badge/Inference-Groq%20LPU-F55036.svg)](https://groq.com/)

---

## 📌 Table of Contents
- [💡 Problem & Mission](#-problem--mission)
- [🤖 Open-Source / Open-Weight AI Architecture](#-open-source--open-weight-ai-architecture)
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

KrishiLink is built from the ground up around **open-weight foundation models**:

```
 ┌─────────────────────────┐
 │   Spoken Voice Audio    │
 │ (English, বাংলা, मराठी)  │
 └────────────┬────────────┘
              │
              ▼
 ┌──────────────────────────────────────────────────────────┐
 │  Continuous Speech Streamer (1200ms Adaptive Debounce)   │
 └────────────────────────────┬─────────────────────────────┘
                              │
                              ▼
 ┌──────────────────────────────────────────────────────────┐
 │    Open-Weight LLM Inference Engine (Qwen / Llama-3)     │
 │    • Real-time Multilingual Intent Classification        │
 │    • Dialect & Phoneme Normalization (বাংলা/मराठी)       │
 │    • Context-Aware Dynamic Slot Filling                  │
 └────────────────────────────┬─────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
 ┌─────────────────────────┐     ┌─────────────────────────┐
 │  Subpage State Machine  │     │   On-Screen OTP Engine  │
 │  (Tabs, Portals, DB)    │     │   (Zero-Password Auth)  │
 └─────────────────────────┘     └─────────────────────────┘
```

1. **Open-Weight Reasoning (`Qwen` & `Llama-3.3`)**:
   - Ultra-fast inference (<800ms) for multi-dialect intent classification, query correction, and slot extraction.
   - Robust normalization of vernacular phonemes and regional number representations (e.g., converting `৫ ৮ ২ ৯` or `५ ८ २ ९` into validated OTP tokens).

2. **Adaptive Conversational Window**:
   - Continuous audio streaming with an adaptive **1200ms silence debounce timer** to prevent mid-sentence speech cutoff and microphone echo loops.

3. **Context-Aware Safety & Cache Flushing**:
   - Automatic purging of stale form context and conversation history on route transitions or manual button clicks, preventing ghost inputs.

4. **Agent Skill Open Standard Compliance**:
   - Structured according to the **Agent Skill Open Standard** ([`SKILL.md`](./SKILL.md)), allowing external autonomous agents to invoke KrishiLink's navigation and logistics tools.

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
- **AI & NLP**: Open-Weight LLMs (`Qwen-2.5-27B` / `Llama-3.3-70B`) via Groq LPU, Web Speech API with continuous streaming.
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
3. Add the 4 environment variables (`DATABASE_URL`, `GROQ_API_KEY`, `GROQ_LLM_MODEL`, `DATA_GOV_IN_API_KEY`).
4. Click **Deploy**. Vercel will build and deploy the application with zero additional configuration needed.

---

## 📜 License & Standards

- **License**: Distributed under the **[MIT License](./LICENSE)**.
- **Agent Specification**: Compliant with the **[Agent Skill Open Standard](./SKILL.md)**.
- **Author**: Aryan Samadder ([@Aryan-Samadder-07](https://github.com/Aryan-Samadder-07))
