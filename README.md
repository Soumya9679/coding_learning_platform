# PulsePy — AI-Powered Python Learning Platform

A premium interactive coding-education platform built with **Next.js 15** (App Router), **React 19**, **TypeScript**, and **Tailwind CSS v4**.  
Students solve graded Python challenges, experiment in a live IDE (Pyodide), receive AI mentor hints (Gemini), and sharpen skills through three gamified experiences — all wrapped in a polished, SaaS-grade UI with smooth animations.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript (strict mode) |
| UI | React 19, Tailwind CSS v4, Framer Motion |
| State Management | Zustand |
| Icons | Lucide React |
| Code Editor | Monaco Editor (`@monaco-editor/react`) |
| Python Runtime | Pyodide (in-browser via CDN) |
| AI Mentor | Google Gemini API |
| Auth | JWT + bcryptjs (httpOnly cookies) |
| Database | Firebase Admin SDK (Firestore) |
| Python Grading | Server-side `child_process` (Python 3) |
| Fonts | Space Grotesk + JetBrains Mono (via `next/font`) |

---

## Features

| Feature | Route | Description |
|---------|-------|-------------|
| Landing Page | `/` | Hero, stats, feature grid, CTA |
| Sign Up | `/signup` | 5-field registration with validation |
| Log In | `/login` | Email/username + password auth |
| Coding Challenges | `/challenges` | 10 graded Python tasks with Monaco editor |
| Live IDE | `/ide` | Pyodide runtime + AI mentor hints |
| Game Lab | `/gamified` | Hub linking to three learning games |
| Bug Hunter | `/game1` | 20-question Python MCQ quiz with lives & levels |
| Flow Slide | `/game2` | 3×3 tile reorder puzzle with timer |
| Velocity Trials | `/game3` | Race an AI rival by answering output questions |

---

## Project Structure

```
coding_learning_platform/
├── app/
│   ├── layout.tsx              # Root layout (fonts, navbar, metadata)
│   ├── page.tsx                # Landing page (hero, stats, features)
│   ├── loading.tsx             # Global loading spinner
│   ├── error.tsx               # Error boundary
│   ├── not-found.tsx           # Custom 404 page
│   ├── globals.css             # Tailwind v4 @theme tokens + base styles
│   ├── login/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── signup/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── challenges/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── ide/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── gamified/page.tsx
│   ├── game1/page.tsx
│   ├── game2/page.tsx
│   ├── game3/page.tsx
│   └── api/
│       ├── health/route.ts
│       ├── auth/
│       │   ├── signup/route.ts
│       │   ├── login/route.ts
│       │   ├── logout/route.ts
│       │   └── session/route.ts
│       ├── challenges/[challengeId]/submit/route.ts
│       └── mentorHint/route.ts
├── components/
│   ├── Navbar.tsx              # Responsive nav with scroll blur + mobile menu
│   └── ui/                     # Reusable UI component library
│       ├── Button.tsx           # 5 variants, 3 sizes, loading state
│       ├── Input.tsx            # Label, error display, auto-id
│       ├── Card.tsx             # Card + CardHeader + CardContent
│       ├── Badge.tsx            # 5 color variants
│       ├── AnimatedSection.tsx  # Framer Motion viewport animations
│       ├── StatusMessage.tsx    # Info/success/error messages
│       └── index.ts             # Barrel export
├── lib/
│   ├── auth.ts                 # JWT, bcrypt, session helpers
│   ├── firebase.ts             # Firebase Admin singleton
│   ├── session.ts              # Client-side token helpers
│   ├── gemini.ts               # Gemini API prompt builder
│   ├── challenges.ts           # 10 challenge suites + Python runner
│   ├── store.ts                # Zustand auth store
│   └── utils.ts                # cn() helper (clsx + tailwind-merge)
├── tsconfig.json
├── next.config.ts
├── postcss.config.mjs
├── package.json
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

Edit `.env.local` with your values:

| Variable | Required | Description |
|----------|----------|-------------|
| `FIREBASE_SERVICE_ACCOUNT` | **Yes** | Firebase service-account JSON (stringified) |
| `GEMINI_API_KEY` | **Yes** | Google Generative Language API key |
| `JWT_SECRET` | Recommended | Random string for signing JWTs (has dev fallback) |
| `GEMINI_MODEL` | Optional | Gemini model name (default: `gemini-2.5-flash`) |
| `PYTHON_BIN` | Optional | Python binary name (default: `python3`) |

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
| `GET` | `/api/health` | Health check (`{ status: "ok" }`) |
| `POST` | `/api/auth/signup` | Register new user |
| `POST` | `/api/auth/login` | Authenticate user |
| `POST` | `/api/auth/logout` | Clear session cookie |
| `GET` | `/api/auth/session` | Validate JWT session |
| `POST` | `/api/challenges/:id/submit` | Grade Python submission |
| `POST` | `/api/mentorHint` | Get AI mentor hint |

---

## Deployment (Vercel)

1. Push to GitHub and import the repo in [Vercel](https://vercel.com)
2. Set **Framework Preset** to **Next.js**
3. Add environment variables (`FIREBASE_SERVICE_ACCOUNT`, `GEMINI_API_KEY`, `JWT_SECRET`)
4. Deploy

> **Note:** The `/api/challenges/:id/submit` route uses `child_process.spawn("python3")` which requires a Python runtime. This works locally but **not on Vercel's serverless functions**. For production, consider switching to Pyodide (client-side) or a dedicated compute backend.

---

## Security

- Passwords hashed with **bcrypt** (12 salt rounds) before storing in Firestore
- Sessions use **JWT** stored in `httpOnly`, `secure`, `sameSite=lax` cookies
- All API routes validate auth via `authenticateFromRequest()` middleware

---

## License

MIT
