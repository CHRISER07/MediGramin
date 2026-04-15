# ArogyaMitra — MediGramin 2.0
### Mobile-based EHR Companion for ASHA Workers in Low-Internet Areas
**Team:** Genesis DEVs | **SIH Problem Statement ID:** 25219

---

## 🏥 What is MediGramin?

MediGramin is a **production-grade rural healthcare command center** built for ASHA (Accredited Social Health Activist) workers and PHC (Primary Health Centre) administrators in low-connectivity areas of India.

It provides AI-powered tools for:
- 📦 **Medicine Inventory Management** — ML forecasting, low-stock alerts, AI insights
- 🧭 **Patient Route Optimization** — KMeans clustering + AI urgency scoring  
- 🩺 **ASHA Visit Logging** — Vitals, triage (Red/Amber/Green), voice-to-text
- 💊 **E-Prescriptions** — Digital prescriptions with QR verification
- 🤖 **Multilingual AI Chatbot** — 7 Indian languages via Gemini 2.0
- 📊 **Analytics Dashboard** — Recharts-powered health & inventory analytics
- 📅 **Appointment Booking** — Doctor slots, printable confirmations

---

## 🛠️ Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18, React Router, Recharts, Lucide Icons |
| Backend | Flask, Flask-CORS, SQLite (WAL mode) |
| AI | Google Gemini 2.0 Flash (direct REST API) |
| ML | Scikit-learn (KMeans, LinearRegression) |
| Voice | Web Speech API (free, browser-native) |
| Styling | Custom CSS design system (glassmorphism, dark mode) |

---

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- A free Google Gemini API key → [aistudio.google.com/apikey](https://aistudio.google.com/apikey)

### 1. Clone & setup environment
```bash
git clone https://github.com/YOUR_USERNAME/medigramin.git
cd medigramin
cp .env.example .env
# Edit .env and add your GOOGLE_API_KEY
```

### 2. Backend
```bash
pip install -r requirements.txt
python server/app.py
# → http://localhost:5000
```

### 3. Frontend
```bash
npm install --legacy-peer-deps
npm start
# → http://localhost:3000
```

---

## 📁 Project Structure

```
medigramin/
├── server/                 # Flask backend
│   ├── app.py              # Main app factory
│   ├── config.py           # Gemini AI + config
│   ├── db.py               # SQLite layer
│   └── routes/             # API blueprints
│       ├── inventory.py    # /api/inventory/*
│       ├── patients.py     # /api/patients/*
│       ├── visits.py       # /api/visits/*
│       ├── chatbot.py      # /api/chatbot/*
│       ├── routing.py      # /api/routing/*
│       └── prescriptions.py
├── src/                    # React frontend
│   ├── pages/              # 13 feature pages
│   ├── components/         # Shared components
│   ├── services/api.js     # Axios API layer
│   └── styles/globals.css  # Design system
├── sample_data/            # Demo CSV datasets
│   ├── inventory.csv       # 120 PHC medicines
│   └── patients_routing.csv # 50 patients with GPS
├── .env.example            # Environment template
└── requirements.txt        # Python deps
```

---

## 🌐 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/inventory/dashboard` | Stats summary |
| POST | `/api/inventory/upload` | Import CSV |
| GET | `/api/inventory/predict/:sku` | ML forecast |
| POST | `/api/inventory/insights` | AI report |
| POST | `/api/chatbot/chat` | Multilingual AI |
| POST | `/api/chatbot/triage` | Red/Amber/Green |
| POST | `/api/routing/upload` | Patient clustering |
| POST | `/api/visits` | Log ASHA visit |

---

## 🔑 Environment Variables

See `.env.example` for all variables. The only required one is:

```env
GOOGLE_API_KEY=your_key_here   # from aistudio.google.com/apikey (free)
```

---

## 👥 Team — Genesis DEVs

Christopher Asser J Albert · Ashutosh Bhonsle · Benzil Saju · Sophia John Chavakula

---

*Built for Smart India Hackathon 2024 — Problem Statement 25219*
