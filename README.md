🚀 OfferLetter Decoder

**Live App:** [https://a5ecdbce.offerlette-decoder.pages.dev/](https://a5ecdbce.offerlette-decoder.pages.dev/)

Analyze job offer letters using AI — detect red flags, understand clauses, and get a ready-to-use negotiation script.

---

## 📌 Overview

OfferLetter Decoder helps users break down complex job offer letters into simple, actionable insights.

You can:

* Upload a PDF or paste text
* Get clause-by-clause explanations
* Detect risky terms (non-compete, IP clauses, etc.)
* Compare salary with market estimates
* Generate a negotiation script instantly

---

## ⚠️ Current Status

* ✅ Frontend deployed on Cloudflare Pages
* ✅ Core AI analysis working
* ❌ Payments (**Razorpay not integrated yet**)
* ❌ Auth + dashboard (in progress / optional)

---

## 🧠 Tech Stack

### Frontend

* React (Vite)
* Tailwind CSS
* Zustand (state management)

### Backend

* Node.js + Express.js
* MongoDB (Atlas)
* pdf-parse (PDF extraction)

### AI

* Google Gemini API

---

## 🏗️ Architecture

```
Client (React)
   |
   v
API (Express)
   |
   +--> MongoDB
   |
   +--> Gemini API
```

---

## ✨ Features

### 🔍 AI Analysis

* Clause extraction
* Plain English explanations
* Risk detection (green / yellow / red)

### 🚨 Red Flag Detection

* Non-compete clauses
* IP ownership traps
* Probation risks

### 💰 Salary Insights

* AI-based market comparison
* Offer evaluation

### 🧾 Negotiation Script

* Ready-to-use script generated automatically

---

## 📁 Project Structure

```
client/
  src/
    components/
    pages/
    store/
    api/

server/
  routes/
  models/
  middleware/
  utils/
```

---

## ⚙️ Setup Instructions

### 1. Clone Repo

```bash
git clone https://github.com/rajcodes0/offerletter-decoder.git
cd offerletter-decoder
```

---

### 2. Install Dependencies

**Client**

```bash
cd client
npm install
npm run dev
```

**Server**

```bash
cd server
npm install
npm run dev
```

---

### 3. Environment Variables

Create `.env` in server:

```
MONGO_URI=your_mongodb_uri
GEMINI_API_KEY=your_api_key
JWT_SECRET=your_secret
```

---

## 🔌 API Endpoints

```
POST /api/analyze
POST /api/auth/register
POST /api/auth/login
GET  /api/analyses/:id
```

---

## 🚀 Deployment

| Layer    | Platform         |
| -------- | ---------------- |
| Frontend | Cloudflare Pages |
| Backend  | Render / Railway |
| DB       | MongoDB Atlas    |

---

## 💳 Payments (Planned)

Integration with Razorpay is planned for:

* Paid analyses
* Premium features (saved reports, higher limits)

---

## ⚡ Roadmap

* [ ] Razorpay integration
* [ ] User authentication
* [ ] Dashboard (saved analyses)
* [ ] Better salary benchmarking (real datasets)
* [ ] PDF export of results

---

## 🧠 Key Learning Highlights

This project demonstrates:

* Full-stack MERN architecture
* AI prompt engineering with structured JSON
* PDF processing pipeline
* Rate limiting for API cost control
* Real-world product thinking

---

## 📄 License

MIT License

---

## ⚠️ Note

This tool provides **AI-based insights**, not legal advice.

---

## 🧑‍💻 Author

Built by Raj
Focused on becoming a top-tier full-stack developer.






