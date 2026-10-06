# VoiceNav AI - Multilingual Voice Navigation Assistant (Mini Project)

An AI-driven virtual voice assistant for web application navigation supporting **English** and **मराठी (Marathi)**, architected for the main project's technology stack (**Next.js**, **FastAPI**, **Python**, **Indic Multilingual APIs**).

---

## 🌟 Key Features

1. **Multilingual Voice Navigation**:
   - Natural speech recognition and voice navigation in **English** (`en-IN`/`en-US`) and **Marathi** (`mr-IN`).
   - Browser Web Speech API for instant zero-latency processing + FastAPI cloud API endpoints (Krutrim / Groq / Sarvam / OpenAI).
2. **Trainable Intent Engine**:
   - Interactive UI & REST API (`/api/assistant/train`) allowing you to add new custom voice phrases in English and Marathi dynamically.
   - Fuzzy token scoring + synonym matching + LLM fallback.
3. **Demo Pages Included**:
   - `/` - **Dashboard (डॅशबोर्ड)**: Overview & quick command suggestions.
   - `/analytics` - **Analytics (ॲनालिटिक्स)**: Metrics, latency charts & stats.
   - `/profile` - **User Profile (माझे प्रोफाईल)**: User credentials & activity logs.
   - `/settings` - **Settings (सेटिंग्ज)**: Audio engines & API configurations.
   - `/diagnostics` - **Diagnostics (निदान आणि चाचणी)**: Pipeline health & stack alignment.
   - `/help` - **Help & Cheatsheet (मदत आणि सहाय्य)**: Voice command guide.
4. **TTS & STT Conversions**:
   - Live speech transcription display (STT).
   - Spoken audio feedback (TTS) in Marathi & English with mute toggle.
   - Status indicators for listening state, detected intent, confidence score, and navigation target.
5. **Pluggable Problem Solver Module (On-Hold)**:
   - Modular endpoint `/api/assistant/problem-solve` ready to connect to domain ML models (Qwen2.5, MobileNet3, XGBoost) when development resumes.
6. **No Heavy Weights Downloads**:
   - 100% lightweight, API-driven, fast to launch and develop.

---

## 🚀 Quick Start Guide

### 1. Start the FastAPI Backend

```bash
# Navigate to backend directory
cd backend

# Install dependencies
pip install -r requirements.txt

# Start FastAPI server on port 8000
python -m uvicorn app.main:app --reload --port 8000
```
Backend will be available at `http://127.0.0.1:8000` (Swagger docs at `http://127.0.0.1:8000/docs`).

### 2. Start the Next.js Frontend

```bash
# In a new terminal, navigate to frontend directory
cd frontend

# Start Next.js development server
npm run dev
```
Open `http://localhost:3000` in Google Chrome or Microsoft Edge (with microphone permission enabled).

---

## 🎙️ Sample Voice Commands to Test

| Target Route | English Voice Commands | मराठी (Marathi) Voice Commands |
| :--- | :--- | :--- |
| **Dashboard** (`/`) | *"Go to dashboard"*, *"Open home page"* | **"मुख्य पृष्ठावर जा"**, **"डॅशबोर्ड दाखवा"** |
| **Analytics** (`/analytics`) | *"Open analytics"*, *"Show metrics and charts"* | **"ॲनालिटिक्स पृष्ठावर जा"**, **"आकडेवारी दाखवा"** |
| **Profile** (`/profile`) | *"Go to my profile"*, *"Show user account"* | **"माझे प्रोफाईल दाखवा"**, **"माझे खाते उघडा"** |
| **Settings** (`/settings`) | *"Open settings"*, *"Change preferences"* | **"सेटिंग्ज उघडा"**, **"पर्याय दाखवा"** |
| **Diagnostics** (`/diagnostics`)| *"Run diagnostics"*, *"Check system health"* | **"निदान पृष्ठ उघडा"**, **"सिस्टम स्थिती तपासा"** |
| **Help & QA** (`/help`)| *"I need help"*, *"Show voice command guide"* | **"मला मदत हवी आहे"**, **"मार्गदर्शिका दाखवा"** |

---

## 🎓 Training New Voice Phrases

1. Open the app at `http://localhost:3000`.
2. Click **"🎓 Train Intents"** in the bottom assistant bar.
3. Select a target page (e.g. *Analytics*), pick the language (*Marathi* or *English*), and type your custom voice phrase (e.g. *"माझी विक्री आकडेवारी दाखवा"*).
4. Click **"Add & Train"**.
5. Speak or type your newly trained phrase — the AI assistant will immediately navigate to the route!

---

## 🏗️ Architecture & Extensibility

```
Voice_Nav/
├── backend/
│   ├── app/
│   │   ├── api/routes.py          # /process, /train, /routes, /stt, /tts, /problem-solve
│   │   ├── core/languages.py      # Extensible Language Registry (EN, MR, HI, etc.)
│   │   ├── services/intent_engine.py # Trainable Fuzzy + LLM intent classifier
│   │   ├── services/speech_service.py # Multilingual STT & TTS API abstraction
│   │   ├── services/problem_solver.py # Pluggable ML/QA placeholder
│   │   └── data/training_intents.json # Persisted training intents
├── frontend/
│   ├── src/
│   │   ├── app/                   # Next.js App Router Demo Pages (/, /analytics, etc.)
│   │   ├── components/VoiceAssistant.tsx # Floating Voice Assistant Bar & Status
│   │   ├── components/IntentTrainer.tsx  # Dynamic Intent Training Interface
│   │   ├── lib/speechClient.ts    # Web Speech API & Backend API client
│   │   └── lib/routesConfig.ts    # Frontend routes metadata
```
