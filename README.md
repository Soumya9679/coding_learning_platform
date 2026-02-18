# PulsePy — AI-Powered Python Learning Platform

An interactive coding-education app built with **Next.js 15** (App Router), **React 19**, and **Firebase**.  
Students solve graded Python challenges, experiment in a live IDE (Pyodide), receive AI mentor hints (Gemini), and sharpen skills through three gamified experiences.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| UI | React 19, CSS Modules |
| Code Editor | @monaco-editor/react |
| Python Runtime | Pyodide (in-browser via CDN) |
| AI Mentor | Google Gemini API |
| Auth | JWT + bcryptjs |
| Database | Firebase Admin SDK (Firestore) |
| Python Grading | Server-side child_process (Python 3) |

---

## Features

| Feature | Route |
|---------|-------|
| Dashboard | `/` |
| Sign Up / Log In | `/signup`, `/login` |
| Coding Challenges | `/challenges` — 10 graded Python tasks with Monaco editor |
| Live IDE | `/ide` — Pyodide runtime + Gemini-powered mentor hints |
| Game Lab | `/gamified` — hub with three games |
| Bug Hunter | `/game1` — 20-question Python MCQ quiz |
| Flow Slide | `/game2` — 3×3 tile reorder puzzle |
| Velocity Trials | `/game3` — race an AI rival by answering output questions |

---

## Project Structure

```
coding_learning_platform/
├── app/
│   ├── layout.jsx              # Root layout (font, navbar, globals)
│   ├── page.jsx                # Landing / dashboard
│   ├── globals.css             # Global styles & CSS variables
│   ├── login/page.jsx
│   ├── signup/page.jsx
│   ├── challenges/page.jsx
│   ├── ide/page.jsx
│   ├── gamified/page.jsx
│   ├── game1/page.jsx
│   ├── game2/page.jsx
│   ├── game3/page.jsx
│   └── api/
│       ├── health/route.js
│       ├── auth/{signup,login,logout,session}/route.js
│       ├── challenges/[challengeId]/submit/route.js
│       └── mentorHint/route.js
├── lib/                        # Server utilities
├── components/                 # Shared React components
├── styles/                     # CSS Modules
├── package.json
├── next.config.mjs
└── .env.local.example
```

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **Python 3** on `PATH` (for server-side challenge grading)
- A **Firebase** project with Firestore enabled
- A **Google Gemini** API key

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.local.example .env.local
```

| Variable | Description |
|----------|-------------|
| `GEMINI_API_KEY` | Google Generative Language API key |
| `AUTH_JWT_SECRET` | Random string for signing JWTs |
| `FIREBASE_SERVICE_ACCOUNT` | Firebase service-account JSON (stringified) |

### 3. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 4. Build for production

```bash
npm run build
npm start
```

---

## API Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/auth/signup` | Register new user |
| POST | `/api/auth/login` | Authenticate user |
| POST | `/api/auth/logout` | Clear session |
| GET | `/api/auth/session` | Validate session |
| POST | `/api/challenges/:id/submit` | Grade Python submission |
| POST | `/api/mentorHint` | Get AI mentor hint |

---

## Security Notes

- Passwords are hashed with bcrypt before storing in Firestore.
- Sessions use JWT stored in httpOnly cookies.

---

## License

MIT
