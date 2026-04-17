# LexAnalytica – Offer Letter Decoder Frontend

A production-grade React frontend for the Offer Letter Decoder app. Dark, professional UI inspired by legal intelligence platforms.

## Tech Stack
- React 18 + Vite
- React Router DOM v6
- React Hook Form (validation)
- React Hot Toast (notifications)
- Axios (API calls)
- Zustand (optional state)
- Custom CSS (no Tailwind dependency)

## Getting Started

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
# Edit .env and set your backend URL:
# VITE_API_URL=http://localhost:5000
```

### 3. Run dev server
```bash
npm run dev
```

### 4. Build for production
```bash
npm run build
```

## Pages & Routes

| Route | Page | Auth |
|-------|------|------|
| `/` | Landing page | Public |
| `/login` | Login | Public |
| `/register` | Register | Public |
| `/forgot-password` | Forgot Password | Public |
| `/reset-password/:token` | Reset Password | Public |
| `/dashboard` | Dashboard (upload + history) | Protected |
| `/history` | Full history list | Protected |
| `/analysis/:id` | Single analysis detail | Protected |

## Folder Structure
```
src/
├── components/
│   ├── Layout/        Navbar, Footer
│   ├── Auth/          ProtectedRoute
│   ├── Analysis/      RiskGauge, ClauseTable, AnalysisResult
│   ├── History/       HistoryItem
│   └── UI/            DeleteConfirmModal
├── pages/             All page components
├── contexts/          AuthContext (JWT + user state)
├── services/          api.js (axios instance + API calls)
├── utils/             formatters.js
└── App.jsx            Router setup
```

## API Integration
The app expects these backend endpoints:

**Auth:**
- `POST /api/register` → `{ name, email, password }`
- `POST /api/login` → `{ email, password }` → `{ token, user }`
- `POST /api/forgot-password` → `{ email }`
- `POST /api/reset-password/:token` → `{ password, confirmPassword }`

**Analysis:**
- `POST /api/analyze` → FormData (pdf) or JSON `{ text }` → analysis object
- `GET /api/analyses` → array of analyses
- `GET /api/analyses/:id` → single analysis
- `DELETE /api/analyses/:id`

All protected routes send `Authorization: Bearer <token>` header automatically.

## Design Notes
- Color scheme: Dark navy (`#0a0c14`) with indigo accent (`#6c63ff`)
- Fonts: Syne (display) + DM Sans (body) — loaded from Google Fonts
- Risk colors: Green `#10b981` / Yellow `#f59e0b` / Red `#ef4444`
- Fully responsive via CSS Grid/Flex
