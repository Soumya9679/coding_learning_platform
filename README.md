# PulsePy — AI-Powered Python Learning Platform

A premium interactive coding-education platform built with **Next.js 15** (App Router), **React 19**, **TypeScript**, and **Tailwind CSS v4**.  
Students solve 20 graded Python challenges in a live IDE (Pyodide), receive AI mentor hints (Gemini), compete on a real-time leaderboard with XP & achievements, and sharpen skills through **five diverse gamified experiences** — all wrapped in a polished, SaaS-grade UI with smooth animations.  
Includes a full **Admin Panel** for user management, platform analytics, and dashboards.

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
| Log In | `/login` | Email/username + password auth, "Forgot Password?" link |
| Forgot Password | `/forgot-password` | Identity-verified password reset (email + username) |
| Live IDE | `/ide` | 20 challenges, Pyodide runtime, progress bar, timer, keyboard shortcuts, AI mentor hints |
| Leaderboard | `/leaderboard` | Dynamic rankings from Firestore, personal stats card, achievements, XP guide |
| Game Lab | `/gamified` | Hub linking to five learning games |
| Syntax Sniper | `/game1` | Type Python snippets against the clock — character-by-character accuracy feedback, WPM tracking, 30 snippets across 3 difficulty tiers (+XP) |
| Pipeline Puzzle | `/game2` | Shuffled code lines — reorder them into the correct sequence to produce the expected output. 20 puzzles, hint system, streak bonuses (+XP) |
| Velocity Trials | `/game3` | Race your car against an AI rival by answering Python output questions. Turbo & Shield powerups, 3-lap system, 25 questions (+XP) |
| Memory Matrix | `/game4` | Card-matching memory game — match Python concepts to their code. 24 pairs, 3 grid sizes, peek-then-recall mechanic (+XP) |
| Code Cascade | `/game5` | Falling Python expressions — type the correct output to blast them. 55 expressions, endless mode, combo scoring, wave progression (+XP) |
| Admin Dashboard | `/admin` | KPI cards (users, XP, activity), top performers, recent signups |
| User Management | `/admin/users` | Search, sort, paginate users; promote/demote/reset/delete with confirmation modals |
| Analytics | `/admin/analytics` | XP/challenge/game/streak distributions, weekly activity, signup trends, per-challenge breakdowns |

---

## Game Mechanics Overview

Each game teaches Python through a **different interaction model** — no two games feel the same:

| Game | Mechanic | Content |
|------|----------|---------|
| **Syntax Sniper** | Real-time typing with accuracy highlighting | 30 Python snippets |
| **Pipeline Puzzle** | Drag-sort shuffled code lines into order | 20 code arrangement puzzles |
| **Velocity Trials** | Racing with streak-earned powerups | 25 output questions |
| **Memory Matrix** | Timed card-matching (concept ↔ code) | 24 concept/code pairs |
| **Code Cascade** | Action-typing: blast falling expressions | 55 Python expressions |

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
│   ├── forgot-password/
│   │   ├── layout.tsx
│   │   └── page.tsx            # Identity-verified password reset
│   ├── ide/
│   │   ├── layout.tsx
│   │   └── page.tsx            # 20 challenges, Monaco editor, Pyodide, AI mentor
│   ├── leaderboard/
│   │   └── page.tsx            # Dynamic rankings, achievements, XP breakdown
│   ├── gamified/page.tsx       # Game Lab hub — links to all 5 games
│   ├── game1/page.tsx          # Syntax Sniper — typing accuracy game
│   ├── game2/page.tsx          # Pipeline Puzzle — code line arrangement
│   ├── game3/page.tsx          # Velocity Trials — AI racing game
│   ├── game4/page.tsx          # Memory Matrix — concept/code card matching
│   ├── game5/page.tsx          # Code Cascade — falling expressions action game
│   ├── admin/
│   │   ├── layout.tsx          # Admin sidebar layout + AdminGuard
│   │   ├── page.tsx            # Admin dashboard (KPIs, top users, signups)
│   │   ├── users/page.tsx      # User management (search, CRUD, modals)
│   │   └── analytics/page.tsx  # Visual analytics with CSS bar charts
│   └── api/
│       ├── health/route.ts
│       ├── auth/
│       │   ├── signup/route.ts         # Initializes user with leaderboard fields
│       │   ├── login/route.ts          # Backfills leaderboard fields for legacy users
│       │   ├── logout/route.ts
│       │   ├── session/route.ts
│       │   └── forgot-password/route.ts # Identity-verified password reset
│       ├── admin/
│       │   ├── check/route.ts          # GET — is current user an admin?
│       │   ├── stats/route.ts          # GET — dashboard aggregate stats
│       │   ├── users/route.ts          # GET — paginated user list with search/sort
│       │   ├── users/[userId]/route.ts # PATCH/DELETE — promote, reset, ban, delete user
│       │   └── analytics/route.ts      # GET — distributions, trends, per-challenge data
│       ├── challenges/
│       │   └── [challengeId]/
│       │       └── submit/route.ts # Challenge submission handler
│       ├── leaderboard/
│       │   ├── route.ts            # GET — global rankings sorted by XP
│       │   ├── me/route.ts         # GET — current user stats + calculated rank
│       │   └── xp/route.ts         # POST — award XP for challenges/games/streaks
│       └── mentorHint/route.ts
├── components/
│   ├── Navbar.tsx              # Responsive nav with scroll blur + mobile menu + conditional admin link
│   ├── AuthGuard.tsx           # Protected route wrapper
│   ├── AdminGuard.tsx          # Admin-only route wrapper (checks /api/admin/check)
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
│   ├── admin.ts                # Admin authentication (ADMIN_EMAILS env + Firestore role)
│   ├── challenges.ts           # Challenge definitions & validation
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
| `ADMIN_EMAILS` | Optional | Comma-separated admin emails (e.g. `admin@example.com`) |

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
| `POST` | `/api/auth/forgot-password` | Reset password (verified by email + username) |
| `GET` | `/api/leaderboard` | Global rankings (top 50, sorted by XP) |
| `GET` | `/api/leaderboard/me` | Current user stats + calculated rank |
| `POST` | `/api/leaderboard/xp` | Award XP (challenge_complete, game_complete, etc.) |
| `POST` | `/api/mentorHint` | Get AI mentor hint for current challenge |
| `GET` | `/api/admin/check` | Check if current user is admin |
| `GET` | `/api/admin/stats` | Dashboard aggregates (users, XP, activity) |
| `GET` | `/api/admin/users` | Paginated user list (search, sort, filter) |
| `PATCH` | `/api/admin/users/[id]` | Update user (role, XP, ban) |
| `DELETE` | `/api/admin/users/[id]` | Delete user |
| `GET` | `/api/admin/analytics` | Platform-wide analytics & distributions |

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
- Admin access controlled via `ADMIN_EMAILS` env variable or Firestore `role: "admin"` field
- Forgot-password identity verification requires matching email + username pair

---

## Admin Panel

The admin panel is accessible at `/admin` for authorized users. Admin access is granted via:

1. **Environment variable** — Add emails to `ADMIN_EMAILS` (comma-separated)
2. **Firestore role** — Set `role: "admin"` on a user document

| Page | Features |
|------|----------|
| Dashboard | 8 KPI cards, top 5 performers, recent signups |
| User Management | Search, sortable columns, pagination, promote/demote/reset XP/delete with confirmation modals |
| Analytics | XP distribution, challenge/game/streak distributions, weekly activity heatmap, 30-day signup trend, per-challenge completion counts |

Admin users see a red **Admin** link in the navbar. The admin layout uses a distinct red accent theme with a sidebar navigation.

---

## License

MIT
