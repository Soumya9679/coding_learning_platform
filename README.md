# PulsePy — AI-Powered Python Learning Platform

A premium interactive coding-education platform built with **Next.js 15** (App Router), **React 19**, **TypeScript**, and **Tailwind CSS v4**.  
Students solve 10 graded Python challenges in a live IDE (Pyodide), receive AI mentor hints (Gemini), compete on a real-time leaderboard with XP & achievements, and sharpen skills through three gamified experiences — all wrapped in a polished, SaaS-grade UI with smooth animations.

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
| XP & Leaderboard | Dynamic Firestore-backed ranking system |
| Fonts | Space Grotesk + JetBrains Mono (via `next/font`) |

---

## Features

| Feature | Route | Description |
|---------|-------|-------------|
| Landing Page | `/` | Hero, stats, feature grid, CTA |
| Sign Up | `/signup` | 5-field registration with validation |
| Log In | `/login` | Email/username + password auth |
| Live IDE | `/ide` | 10 challenges, Pyodide runtime, progress bar, timer, keyboard shortcuts, AI mentor hints |
| Leaderboard | `/leaderboard` | Dynamic rankings from Firestore, personal stats card, achievements, XP guide |
| Game Lab | `/gamified` | Hub linking to three learning games |
| Bug Hunter | `/game1` | 20-question Python MCQ quiz with lives & levels (+XP on completion) |
| Flow Slide | `/game2` | 3×3 tile reorder puzzle with timer (+XP on completion) |
| Velocity Trials | `/game3` | Race an AI rival by answering output questions (+XP on win) |

---

## Project Structure

```
coding_learning_platform/
├── app/
│   ├── layout.tsx              # Root layout (fonts, navbar, metadata, favicon)
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
│   ├── ide/
│   │   ├── layout.tsx
│   │   └── page.tsx            # 10 challenges, Monaco editor, Pyodide, AI mentor
│   ├── leaderboard/
│   │   ├── layout.tsx
│   │   └── page.tsx            # Dynamic rankings, achievements, XP breakdown
│   ├── gamified/page.tsx
│   ├── game1/page.tsx          # Bug Hunter — awards XP on completion
│   ├── game2/page.tsx          # Flow Slide — awards XP on completion
│   ├── game3/page.tsx          # Velocity Trials — awards XP on win
│   └── api/
│       ├── health/route.ts
│       ├── auth/
│       │   ├── signup/route.ts     # Initializes user with leaderboard fields
│       │   ├── login/route.ts      # Backfills leaderboard fields for legacy users
│       │   ├── logout/route.ts
│       │   └── session/route.ts
│       ├── leaderboard/
│       │   ├── route.ts            # GET — global rankings sorted by XP
│       │   ├── me/route.ts         # GET — current user stats + calculated rank
│       │   └── xp/route.ts         # POST — award XP for challenges/games/streaks
│       └── mentorHint/route.ts
├── components/
│   ├── Navbar.tsx              # Responsive nav with scroll blur + mobile menu
│   ├── AuthGuard.tsx           # Protected route wrapper
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
│   ├── session.ts              # Client-side token helpers + applyAuthHeaders()
│   ├── gemini.ts               # Gemini API prompt builder
│   ├── store.ts                # Zustand auth store
│   └── utils.ts                # cn() helper (clsx + tailwind-merge)
├── public/
│   └── favicon.ico             # PulsePy browser tab icon
├── tsconfig.json
├── next.config.ts
├── postcss.config.mjs
├── package.json
└── .env.local.example
```

---

## XP & Leaderboard System

Users earn XP through challenges, games, and streaks. All data is stored in Firestore and rankings update in real time.

| Action | XP Awarded |
|--------|-----------|
| Complete a challenge | +100 XP |
| First-try challenge success | +150 XP |
| Repeat a completed challenge | +25 XP (25%) |
| Complete a mini-game | +50 XP |
| Perfect game score (no mistakes) | +100 XP |
| Daily login streak | +25 XP |

**Achievements** unlock dynamically based on your stats (XP, challenges completed, streak, games played, rank).

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 18
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
| `POST` | `/api/auth/signup` | Register new user (initializes XP fields) |
| `POST` | `/api/auth/login` | Authenticate user (backfills XP fields) |
| `POST` | `/api/auth/logout` | Clear session cookie |
| `GET` | `/api/auth/session` | Validate JWT session |
| `GET` | `/api/leaderboard` | Global rankings (top 50, sorted by XP) |
| `GET` | `/api/leaderboard/me` | Current user stats + calculated rank |
| `POST` | `/api/leaderboard/xp` | Award XP (challenge_complete, game_complete, etc.) |
| `POST` | `/api/mentorHint` | Get AI mentor hint for current challenge |

---

## Deployment (Vercel)

1. Push to GitHub and import the repo in [Vercel](https://vercel.com)
2. Set **Framework Preset** to **Next.js**
3. Add environment variables (`FIREBASE_SERVICE_ACCOUNT`, `GEMINI_API_KEY`, `JWT_SECRET`)
4. Deploy

> All Python execution runs client-side via **Pyodide** — no server-side Python runtime needed.

---

## Security

- Passwords hashed with **bcrypt** (12 salt rounds) before storing in Firestore
- Sessions use **JWT** stored in `httpOnly`, `secure`, `sameSite=lax` cookies
- All protected API routes validate auth via `authenticateFromRequest()` middleware
- XP endpoint validates action types and prevents duplicate full-XP awards for the same challenge

---

## License

MIT
