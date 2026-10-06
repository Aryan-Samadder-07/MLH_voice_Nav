# 🌾 KrishiLink: Multilingual AI Voice Navigation & Agri-Commerce Platform

> **🏆 Built for Major League Hacking (MLH) — Best Open-Source AI Project Challenge**  
> *An accessibility-first, voice-controlled agritech ecosystem powered by open-weight LLMs (`Qwen` & `Llama-3`) and open-source speech processing.*

[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](https://opensource.org/licenses/MIT)
[![Open-Weight AI](https://img.shields.io/badge/AI-Open--Weight%20LLMs-blue.svg)](https://github.com/QwenLM/Qwen2.5)
[![Next.js 16](https://img.shields.io/badge/Next.js-16.3-black.svg)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL%20%2F%20Prisma-336791.svg)](https://www.prisma.io/)

---

## 💡 The Problem & Mission
India is home to over 140 million agricultural producers, yet the majority face steep digital barriers due to complex interfaces, mandatory text-heavy forms, password management, and a lack of regional language voice support.

**KrishiLink** bridges this accessibility divide by providing an intelligent, **zero-password, multilingual voice-guided agritech marketplace**. Farmers, buyers, and transporters can trade produce, negotiate bids, and coordinate logistics entirely using their spoken regional dialects (**English**, **Bengali / বাংলা**, and **Marathi / मराठी**).

---

## 🤖 Open-Source / Open-Weight AI Architecture

KrishiLink is built from the ground up around **open-weight foundation models and open-source harnesses**:

```
 ┌────────────────┐       ┌────────────────────────┐       ┌─────────────────────────┐
 │ Voice Speech   │ ────> │ Open-Source Continuous │ ────> │ Open-Weight LLM Core    │
 │ (EN / BN / MR) │       │ Audio Pipeline         │       │ (Qwen-2.5 / Llama-3.3)  │
 └────────────────┘       └────────────────────────┘       └───────────┬─────────────┘
                                                                       │
                                              ┌────────────────────────┴────────────────────────┐
                                              ▼                                                 ▼
                                  ┌───────────────────────┐                         ┌───────────────────────┐
                                  │ Intent Classification │                         │ Dynamic Slot Extractor│
                                  │ & Subpage Routing     │                         │ & On-Screen OTP Engine│
                                  └───────────────────────┘                         └───────────────────────┘
```

1. **Open-Weight Reasoning (`Qwen` & `Llama-3.3`)**:
   - Deployed via high-throughput inference for sub-second, multi-dialect intent classification and conversational reasoning.
   - Robust normalization of regional phonemes, colloquial village expressions, and number representations (e.g. converting `৫ ৮ ২ ৯` or `५ ८ २ ९` into verified OTP tokens).

2. **Open-Source Agent Skill Standard (`SKILL.md`)**:
   - Compliant with the **Agent Skill Open Standard**, allowing external AI agents to invoke KrishiLink's navigation, listing, and logistics matching capabilities.

3. **Natural Conversational Window**:
   - Adaptive 1200ms silence debounce buffer with interim transcript streaming to prevent speech cutoff mid-sentence and eliminate speaker echo loops.

4. **Zero-Password On-Screen OTP System**:
   - Replaces cumbersome voice passwords with instant, on-screen 4-digit visual OTP generation, spoken confirmations, and automated verification.

---

## 🌟 Key Features

- 🎙️ **Multilingual Voice Navigation**: Seamlessly navigate pages (*Farmer View*, *Buyer View*, *Transporter View*, *Admin Console*) and sub-tabs (*Active Bids*, *Produce Listings*, *Cargo Jobs*, *Ledger*) using voice commands in English, Bengali, or Marathi.
- 📱 **Passwordless Voice Onboarding**: Full signup and login powered by on-screen visual OTP badges and spoken confirmations.
- 🌐 **Dynamic Live Translation**: Instant UI translation toggle (`EN | मराठी | বাংলা`) driven by Google Translate and conversational AI.
- 🚛 **Smart Logistics & Matching**: Real-time freight quote calculation, route distance calculation, and matching between produce lots and regional transporters.
- 🔒 **Context-Aware Safety**: Automated context clearing on user navigation to eliminate lingering form states and session confusion.

---

## 🚀 Quick Start & Installation

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL database (or Neon DB)
- Groq API Key (for open-weight Qwen/Llama inference)

### 1. Clone the Repository
```bash
git clone https://github.com/Aryan-Samadder-07/SIH_voice_Nav.git
cd SIH_voice_Nav/SIH
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Environment Variables
Create a `.env` file in `SIH/`:
```env
DATABASE_URL="your-postgresql-database-url"
GROQ_API_KEY="your-groq-api-key"
GROQ_LLM_MODEL="qwen/qwen3.8-27b"
DATA_GOV_IN_API_KEY="optional-mandi-api-key"
```

### 4. Setup Database & Start Server
```bash
npx prisma db push
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📂 Project Structure

```
SIH_voice_Nav/
├── SIH/                            # Main Next.js 16 Agri-Commerce Application
│   ├── src/
│   │   ├── app/                    # Next.js App Router (Farmer, Buyer, Transporter, Admin)
│   │   │   └── api/                # API Routes (assistant command, auth, mandi, logistics)
│   │   ├── components/             # UI Components (VoiceAssistant, IntentTrainer, GoogleTranslate)
│   │   ├── context/                # User Context (Auth session) & Language Context
│   │   └── lib/                    # Speech client, Prisma DB client, Logistics utilities
│   └── prisma/                     # Database Schema & Models
├── Voice_Nav/                      # AI Voice Engine & Reference Architecture
│   ├── backend/                    # Python FastAPI model harness & intent engine
│   └── frontend/                   # Voice testing laboratory
├── SKILL.md                        # Agent Skill Open Standard Specification
├── LICENSE                         # MIT Open-Source License
└── README.md                       # Project Documentation
```

---

## 📜 Open-Source License
Distributed under the **MIT License**. See [`LICENSE`](./LICENSE) for more details.
