# PulsePy — AI-Powered Python Learning Platform

A premium interactive coding-education platform built with **Next.js 15** (App Router), **React 19**, **TypeScript**, and **Tailwind CSS v4**.  
Students solve 20 graded Python challenges in a mobile-responsive live IDE (Pyodide), receive AI mentor hints (Gemini), compete on a real-time leaderboard with XP & achievements, battle in **real-time coding duels**, build & share community challenges, and sharpen skills through **five diverse gamified experiences** — all wrapped in a polished, SaaS-grade UI with smooth animations.  
Features a **15-level progression system** with unique titles, a **30-achievement unlock engine** with 5 rarity tiers, **daily & weekly coding challenges** with XP multipliers, a **progress dashboard** with GitHub-style activity calendar, and a **notification center** with real-time alerts.  
Includes a full **Admin Panel** for user management, challenge CRUD, platform analytics, and dashboards. Supports **OAuth login** (Google & GitHub), **PWA** install, social features (follow/friends), and challenge discussions.

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
| Auth | JWT + bcryptjs (httpOnly cookies), OAuth 2.0 (Google, GitHub) |
| Database | Firebase Admin SDK (Firestore) |
| Validation | Zod (request schema validation on all API routes) |
| Rate Limiting | Upstash Redis (production) + in-memory fallback (dev) |
| Error Tracking | Sentry (client, server, edge) |
| Testing | Jest 30, React Testing Library, Playwright (E2E) |
| XP & Leaderboard | Dynamic Firestore-backed ranking system with HMAC-signed XP proof tokens |
| SEO | Dynamic sitemap, robots.txt (via Next.js Metadata API) |
| Fonts | Space Grotesk + JetBrains Mono (via `next/font`) |

---

## Features

| Feature | Route | Description |
|---------|-------|-------------|
| Landing Page | `/` | Hero, stats, feature grid, CTA |
| Sign Up | `/signup` | 5-field registration with real-time field validation, inline password strength indicators |
| Log In | `/login` | Email/username + password auth with show/hide toggle, "Forgot Password?" link |
| Forgot Password | `/forgot-password` | Identity-verified password reset (email + username) |
| Live IDE | `/ide` | Firestore-backed challenges, Pyodide runtime, progress bar, timer, difficulty + category filters, AI mentor hints, challenge discussion |
| Learning Paths | `/paths` | Structured challenge sequences grouped by topic, progress tracking per path, overall progress bar |
| Leaderboard | `/leaderboard` | Dynamic rankings from Firestore, personal stats card, achievements, XP guide, social follow/share |
| Game Lab | `/gamified` | Hub linking to five learning games |
| Profile | `/profile` | Full user profile with stats, rank, achievements, recent submissions, editable display name |
| Code History | `/history` | Browse past submissions with expandable code view, copy-to-clipboard, challenge filter, pagination |
| Settings | `/settings` | Change password (with strength indicators), delete account with confirmation |
| Syntax Sniper | `/game1` | Type Python snippets against the clock — character-by-character accuracy feedback, WPM tracking, 30 snippets across 3 difficulty tiers (+XP) |
| Pipeline Puzzle | `/game2` | Shuffled code lines — reorder them into the correct sequence to produce the expected output. 20 puzzles, hint system, streak bonuses (+XP) |
| Velocity Trials | `/game3` | Race your car against an AI rival by answering Python output questions. Turbo & Shield powerups, 3-lap system, 25 questions (+XP) |
| Memory Matrix | `/game4` | Card-matching memory game — match Python concepts to their code. 24 pairs, 3 grid sizes, peek-then-recall mechanic (+XP) |
| Code Cascade | `/game5` | Falling Python expressions — type the correct output to blast them. 55 expressions, endless mode, combo scoring, wave progression (+XP) |
| Admin Dashboard | `/admin` | KPI cards (users, XP, activity), top performers, recent signups |
| Challenge Manager | `/admin/challenges` | Full CRUD for IDE challenges — create, edit, reorder, toggle active/inactive, seed defaults, delete with confirmation |
| User Management | `/admin/users` | Search, sort, paginate users; promote/demote/reset/delete with confirmation modals, CSV export |
| Analytics | `/admin/analytics` | XP/challenge/game/streak distributions, weekly activity, signup trends, per-challenge breakdowns, CSV export |
| Audit Log | `/admin/audit` | Track all admin actions — color-coded entries, refresh, CSV export |
| Community Challenges | `/community` | Browse, create & play user-built challenges with likes, tag filters, difficulty levels, search & pagination |
| Coding Duels | `/duels` | Real-time head-to-head Python coding battles with lobby, matchmaking, timer, live status, +50 XP to winner |
| Daily Challenges | `/daily` | Daily (2x XP) and weekly (3x XP) coding challenges with countdown timers, deterministic selection, Pyodide editor, submit & verify |
| Progress Dashboard | `/progress` | GitHub-style streak calendar (365 days), XP bar chart (30 days), XP breakdown, achievement grid with rarity filters, level progress bar, stats cards |
| Notification Center | Navbar | Bell icon with unread count badge, dropdown panel, mark-all-read, auto-polling, notification types: achievements, level-ups, streaks, daily completions |
| User Levels & Titles | Navbar / Profile | 15-level progression system (Newbie → Code God), unique colors & icons per level, XP progress bar, level-up notifications |
| Achievement System | Profile / Progress | 30 achievements across 7 categories, 5 rarity tiers (common → legendary), auto-evaluation on XP events, Firestore persistence |
| Social Features | `/leaderboard` | Follow/unfollow users, friends-only leaderboard filter, share achievements via Web Share API |
| Challenge Discussion | `/ide` | Comment on completed challenges, like comments, threaded discussion panel |
| OAuth Login | `/login`, `/signup` | Sign in with Google or GitHub (OAuth 2.0) alongside email/password |
| PWA Support | — | Installable Progressive Web App with service worker, offline caching, app manifest, dedicated offline page |
| Dark/Light Theme | — | Toggle between dark and light themes (persisted in localStorage) |
| Offline Page | `/offline` | Friendly fallback page when the user loses internet connectivity |

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
│   ├── layout.tsx              # Root layout (fonts, navbar, metadata, skip-to-content)
│   ├── page.tsx                # Landing page (hero, stats, features)
│   ├── loading.tsx             # Global loading spinner
│   ├── error.tsx               # Global error boundary
│   ├── not-found.tsx           # Custom 404 page
│   ├── sitemap.ts              # Dynamic sitemap.xml (Next.js Metadata API)
│   ├── robots.ts               # Dynamic robots.txt (Next.js Metadata API)
│   ├── globals.css             # Tailwind v4 @theme tokens + base styles
│   ├── login/
│   │   ├── layout.tsx
│   │   └── page.tsx            # Login with show/hide password toggle
│   ├── signup/
│   │   ├── layout.tsx
│   │   └── page.tsx            # Real-time field validation, inline password strength
│   ├── forgot-password/
│   │   ├── layout.tsx
│   │   └── page.tsx            # Identity-verified password reset
│   ├── ide/
│   │   ├── layout.tsx
│   │   ├── error.tsx           # IDE-specific error boundary
│   │   └── page.tsx            # Challenges, Monaco editor, Pyodide, AI mentor, filters
│   ├── leaderboard/
│   │   └── page.tsx            # Dynamic rankings, achievements, XP breakdown
│   ├── profile/
│   │   ├── layout.tsx
│   │   ├── error.tsx           # Profile error boundary
│   │   └── page.tsx            # User profile — stats, achievements, recent submissions
│   ├── settings/
│   │   ├── layout.tsx
│   │   └── page.tsx            # Change password, delete account
│   ├── history/
│   │   ├── layout.tsx
│   │   └── page.tsx            # Code history — browse past solutions with code viewer
│   ├── paths/
│   │   ├── layout.tsx
│   │   └── page.tsx            # Learning paths — topic-based challenge sequences
│   ├── community/
│   │   ├── layout.tsx
│   │   ├── error.tsx           # Community error boundary
│   │   └── page.tsx            # Community challenge builder & browser
│   ├── duels/
│   │   ├── layout.tsx
│   │   ├── error.tsx           # Duels error boundary
│   │   └── page.tsx            # Real-time coding duels — lobby, arena, results
│   ├── daily/
│   │   ├── layout.tsx
│   │   ├── loading.tsx         # Skeleton loading state
│   │   ├── error.tsx           # Daily error boundary
│   │   └── page.tsx            # Daily & weekly challenges — editor, submit, countdown
│   ├── progress/
│   │   ├── layout.tsx
│   │   ├── loading.tsx         # Skeleton loading state
│   │   ├── error.tsx           # Progress error boundary
│   │   └── page.tsx            # Progress dashboard — streak calendar, XP chart, achievements
│   ├── offline/page.tsx        # PWA offline fallback page
│   ├── gamified/
│   │   ├── layout.tsx          # SEO metadata for game hub
│   │   └── page.tsx            # Game Lab hub — links to all 5 games
│   ├── game1/
│   │   ├── layout.tsx          # SEO metadata
│   │   └── page.tsx            # Syntax Sniper — typing accuracy game
│   ├── game2/
│   │   ├── layout.tsx          # SEO metadata
│   │   └── page.tsx            # Pipeline Puzzle — code line arrangement
│   ├── game3/
│   │   ├── layout.tsx          # SEO metadata
│   │   └── page.tsx            # Velocity Trials — AI racing game
│   ├── game4/
│   │   ├── layout.tsx          # SEO metadata
│   │   └── page.tsx            # Memory Matrix — concept/code card matching
│   ├── game5/
│   │   ├── layout.tsx          # SEO metadata
│   │   └── page.tsx            # Code Cascade — falling expressions action game
│   ├── admin/
│   │   ├── layout.tsx          # Admin sidebar layout + AdminGuard + noindex meta
│   │   ├── error.tsx           # Admin error boundary
│   │   ├── page.tsx            # Admin dashboard (KPIs, top users, signups)
│   │   ├── challenges/page.tsx # Challenge CRUD manager (create, edit, reorder, seed)
│   │   ├── users/page.tsx      # User management (search, CRUD, modals, CSV export)
│   │   ├── analytics/page.tsx  # Visual analytics with CSS bar charts + CSV export
│   │   └── audit/page.tsx      # Audit log viewer — admin action history
│   └── api/
│       ├── health/route.ts
│       ├── auth/
│       │   ├── signup/route.ts         # Initializes user with leaderboard fields
│       │   ├── login/route.ts          # Backfills leaderboard fields for legacy users
│       │   ├── logout/route.ts
│       │   ├── session/route.ts
│       │   ├── forgot-password/route.ts # Identity-verified password reset
│       │   └── oauth/
│       │       ├── google/route.ts          # Google OAuth redirect
│       │       ├── google/callback/route.ts # Google OAuth callback
│       │       ├── github/route.ts          # GitHub OAuth redirect
│       │       └── github/callback/route.ts # GitHub OAuth callback
│       ├── admin/
│       │   ├── check/route.ts          # GET — is current user an admin?
│       │   ├── stats/route.ts          # GET — dashboard aggregate stats
│       │   ├── challenges/route.ts         # GET (public+admin) / POST (admin)
│       │   ├── challenges/[challengeId]/route.ts # PATCH/DELETE — update or remove
│       │   ├── challenges/seed/route.ts    # POST — seed default challenges
│       │   ├── users/route.ts          # GET — paginated user list with search/sort
│       │   ├── users/[userId]/route.ts # PATCH/DELETE — promote, reset, ban, delete
│       │   ├── analytics/route.ts      # GET — distributions, trends, per-challenge data
│       │   ├── audit/route.ts          # GET — recent audit log entries
│       │   └── export/route.ts         # GET — CSV export (users, analytics, audit)
│       ├── challenges/
│       │   └── submit/route.ts         # POST — submit solution, validate, award XP
│       ├── profile/route.ts            # GET / PATCH — user profile + stats + achievements
│       ├── settings/route.ts           # PATCH / DELETE — change password, delete account
│       ├── submissions/route.ts        # GET — user's past submissions with code
│       ├── paths/route.ts              # GET — learning paths from challenge tags + progress
│       ├── comments/route.ts           # GET/POST/PATCH — challenge discussion comments
│       ├── community/
│       │   └── challenges/route.ts     # GET/POST/PATCH — community-built challenges
│       ├── duels/route.ts              # GET/POST — coding duels (create, join, submit, cancel)
│       ├── social/
│       │   └── follow/route.ts         # GET/POST — follow/unfollow users
│       ├── notifications/route.ts   # GET/PATCH/DELETE — notification center (unread filter, mark read, delete)
│       ├── daily/route.ts           # GET/POST — daily & weekly challenges (deterministic selection, submit, XP award)
│       ├── progress/route.ts        # GET — full progress dashboard (streak, XP history, achievements, level)
│       ├── leaderboard/
│       │   ├── route.ts            # GET — global rankings sorted by XP
│       │   ├── me/route.ts         # GET — current user stats + calculated rank
│       │   └── xp/route.ts         # POST — award XP + achievement evaluation + level-up checks
│       └── mentorHint/route.ts     # POST — AI mentor hints (rate limited)
├── components/
│   ├── Navbar.tsx              # Responsive nav with scroll blur, mobile menu, notification bell, level badge, outside-click close
│   ├── NotificationBell.tsx    # Notification dropdown — bell icon, unread count, mark-all-read, auto-polling
│   ├── AuthGuard.tsx           # Protected route wrapper
│   ├── AdminGuard.tsx          # Admin-only route wrapper (checks /api/admin/check)
│   ├── ThemeToggle.tsx         # Dark/light theme toggle button
│   ├── ThemeHydrator.tsx       # Server-safe theme hydration
│   ├── PWARegister.tsx         # Service worker registration + OAuth token pickup
│   └── ui/                     # Reusable UI component library
│       ├── Button.tsx           # 5 variants, 3 sizes, loading state
│       ├── Input.tsx            # Label, error display with role="alert", auto-id
│       ├── Card.tsx             # Card + CardHeader + CardContent
│       ├── Badge.tsx            # 6 color variants (accent, success, danger, warning, neutral, info)
│       ├── AnimatedSection.tsx  # Framer Motion viewport animations + reduced-motion support
│       ├── StatusMessage.tsx    # Info/success/error messages
│       ├── Toast.tsx            # Toast notification system (success/error/warning/info)
│       ├── Pagination.tsx       # Reusable pagination component
│       ├── Skeleton.tsx         # Loading skeleton placeholders
│       ├── UserAvatar.tsx       # Gravatar-backed user avatar (uses next/image)
│       └── index.ts             # Barrel export
├── hooks/
│   ├── usePyodide.ts           # Persistent singleton Pyodide worker (warm worker pattern, pre-warmed on mount)
│   ├── useDuelStream.ts        # SSE hook for real-time duel arena updates
│   └── useLobbyStream.ts       # SSE hook for real-time duel lobby updates
├── lib/
│   ├── auth.ts                 # JWT, bcrypt, session helpers, password policy, sanitizeText()
│   ├── admin.ts                # Admin authentication (ADMIN_EMAILS env + Firestore role)
│   ├── firebase.ts             # Firebase Admin singleton
│   ├── session.ts              # Client-side token helpers + applyAuthHeaders()
│   ├── gemini.ts               # Gemini API prompt builder
│   ├── store.ts                # Zustand auth store (with xp field for level badge)
│   ├── themeStore.ts           # Zustand theme store (dark/light persistence)
│   ├── levels.ts               # 15-level progression system — computeLevel(), checkLevelUp()
│   ├── achievements.ts         # 30 achievements engine — evaluateAchievements(), 5 rarity tiers
│   ├── rateLimit.ts            # Upstash Redis rate limiter + in-memory fallback (sync & async APIs)
│   ├── validators.ts           # Zod schemas for all API endpoints + parseBody() helper
│   ├── xpToken.ts              # HMAC-signed single-use XP proof tokens (anti-cheat)
│   ├── duelStore.ts            # Zustand store for real-time duel state
│   ├── auditLog.ts             # Firestore audit log writer & reader
│   ├── types.ts                # Shared TypeScript types & interfaces (UserLevel, Notification, DailyChallenge, ProgressStats, etc.)
│   └── utils.ts                # cn() helper (clsx + tailwind-merge)
├── middleware.ts                # Edge middleware — security headers + route protection
├── __tests__/                   # Jest test suites (9 suites, 109 tests)
│   ├── api/auth/
│   │   └── login.test.ts       # Login API integration tests
│   ├── components/
│   │   ├── AuthGuard.test.tsx   # Auth guard component tests
│   │   └── Badge.test.tsx       # Badge component tests
│   └── lib/
│       ├── achievements.test.ts # Achievement definitions & check functions
│       ├── auth.test.ts         # JWT & session helper tests
│       ├── levels.test.ts       # Level system (computeLevel, checkLevelUp)
│       ├── rateLimit.test.ts    # Rate limiter (sync, async, getClientIp)
│       ├── utils.test.ts        # Utility function tests
│       └── validators.test.ts   # Zod schema validation tests (all endpoints)
├── e2e/                         # Playwright E2E tests
│   └── app.spec.ts              # Smoke tests (pages, auth flows, API health)
├── public/
│   ├── favicon.ico             # PulsePy browser tab icon
│   ├── manifest.json           # PWA web app manifest
│   ├── sw.js                   # Service worker (auth-aware caching, network-only for protected routes, offline fallback)
│   └── icons/                  # PWA app icons (192x192, 512x512)
├── jest.config.ts              # Jest configuration (next/jest + jsdom)
├── jest.setup.ts               # Jest setup — @testing-library/jest-dom matchers
├── playwright.config.ts        # Playwright E2E config (Chromium, webServer auto-start)
├── instrumentation.ts          # Sentry server + edge init (Next.js instrumentation hook)
├── instrumentation-client.ts   # Sentry client-side init (replays, error filtering, router transitions)
├── tsconfig.json
├── next.config.ts              # Security headers, image optimization, API caching, Sentry integration
├── postcss.config.mjs
└── package.json
```

---

## XP, Levels & Leaderboard System

Users earn XP through challenges, games, duels, daily challenges, and streaks. All data is stored in Firestore and rankings update in real time.

| Action | XP Awarded |
|--------|------------|
| Complete a challenge | +100 XP |
| First-try challenge success | +150 XP |
| Repeat a completed challenge | +25 XP (25%) |
| Complete a mini-game | +50 XP |
| Perfect game score (no mistakes) | +100 XP |
| Win a coding duel | +50 XP |
| Daily login streak | +25 XP |
| Daily challenge (correct) | Base XP × 2 |
| Weekly challenge (correct) | Base XP × 3 |

### User Levels (15 Tiers)

| Level | Title | XP Required |
|-------|-------|------------|
| 1 | Newbie | 0 |
| 2 | Beginner | 100 |
| 3 | Apprentice | 300 |
| 4 | Coder | 600 |
| 5 | Developer | 1,000 |
| 6 | Engineer | 1,500 |
| 7 | Specialist | 2,200 |
| 8 | Expert | 3,000 |
| 9 | Master | 4,000 |
| 10 | Grand Master | 5,500 |
| 11 | Legend | 7,500 |
| 12 | Mythic | 10,000 |
| 13 | Transcendent | 15,000 |
| 14 | Immortal | 25,000 |
| 15 | Code God | 50,000 |

Level-up events trigger an in-app notification and are displayed in the progress dashboard milestones.

### Achievements (30 Total, 5 Rarity Tiers)

Achievements unlock automatically when XP events are processed. Stored persistently in Firestore.

| Rarity | Color | Count | Example |
|--------|-------|-------|---------|
| Common | Zinc | 6 | First Steps (earn 10 XP) |
| Uncommon | Green | 8 | Challenge Accepted (complete 5 challenges) |
| Rare | Blue | 7 | Hot Streak (7-day streak) |
| Epic | Purple | 6 | Top 10 (reach leaderboard top 10) |
| Legendary | Amber | 3 | Immortal Flame (100-day streak) |

Categories: **XP**, **Challenge**, **Streak**, **Game**, **Social/Duels**, **Rank**, **Special**.

### Daily & Weekly Challenges

- **14 daily challenges** rotated deterministically by date (hash-based selection)
- **4 weekly challenges** (harder — Merge Sort, BST, LRU Cache, Graph BFS)
- Daily challenges award **2× XP multiplier**, weekly challenges award **3× XP**
- Each challenge can only be completed once per rotation period
- Completion count tracked globally across all users

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
| `JWT_SECRET` | **Yes (prod)** | Random string for signing JWTs & XP tokens — **required in production**, dev uses fallback |
| `GEMINI_MODEL` | Optional | Gemini model name (default: `gemini-2.5-flash`) |
| `ADMIN_EMAILS` | Optional | Comma-separated admin emails (e.g. `admin@example.com`) |
| `GOOGLE_CLIENT_ID` | Optional | Google OAuth 2.0 client ID (for Google login) |
| `GOOGLE_CLIENT_SECRET` | Optional | Google OAuth 2.0 client secret |
| `GITHUB_CLIENT_ID` | Optional | GitHub OAuth App client ID (for GitHub login) |
| `GITHUB_CLIENT_SECRET` | Optional | GitHub OAuth App client secret |
| `UPSTASH_REDIS_REST_URL` | Optional | Upstash Redis URL for distributed rate limiting (falls back to in-memory) |
| `UPSTASH_REDIS_REST_TOKEN` | Optional | Upstash Redis auth token |
| `NEXT_PUBLIC_SENTRY_DSN` | Optional | Sentry DSN for error tracking (disabled if unset) |
| `SENTRY_ORG` | Optional | Sentry organization slug (for source map uploads) |
| `SENTRY_PROJECT` | Optional | Sentry project slug |
| `SENTRY_AUTH_TOKEN` | Optional | Sentry auth token (for source map uploads) |
| `NEXT_PUBLIC_SITE_URL` | Optional | Canonical site URL for sitemap/robots (default: `https://pulsepy.tech`) |

### 3. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 4. Run tests

```bash
npm test                # run all Jest tests (109 tests, 9 suites)
npm run test:watch      # watch mode
npm run test:coverage   # with coverage report
npm run test:e2e        # run Playwright E2E tests (requires: npx playwright install)
npm run test:e2e:ui     # Playwright E2E with interactive UI
```

### 5. Build for production

```bash
npm run build
npm start
```

---

## API Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check (`{ status: "ok" }`) |
| `POST` | `/api/auth/signup` | Register new user (rate limited: 5/15m) |
| `POST` | `/api/auth/login` | Authenticate user (rate limited: 10/15m) |
| `POST` | `/api/auth/logout` | Clear session cookie |
| `GET` | `/api/auth/session` | Validate JWT session |
| `POST` | `/api/auth/forgot-password` | Reset password (rate limited: 5/15m) |
| `GET` | `/api/leaderboard` | Global rankings (top 50, sorted by XP) |
| `GET` | `/api/leaderboard/me` | Current user stats + calculated rank |
| `POST` | `/api/leaderboard/xp` | Award XP (challenge_complete, game_complete, etc.) |
| `POST` | `/api/challenges/submit` | Submit challenge solution — server-side validation + XP award (rate limited: 20/min) |
| `GET` | `/api/profile` | Full user profile, stats, achievements, recent submissions |
| `PATCH` | `/api/profile` | Update display name |
| `PATCH` | `/api/settings` | Change password |
| `DELETE` | `/api/settings` | Delete own account (password confirmed) |
| `GET` | `/api/submissions` | Browse past submissions with code (optional challenge filter) |
| `GET` | `/api/paths` | Learning paths derived from challenge tags + user progress |
| `POST` | `/api/mentorHint` | Get AI mentor hint for current challenge (rate limited: 5/min) |
| `GET` | `/api/admin/check` | Check if current user is admin |
| `GET` | `/api/admin/stats` | Dashboard aggregates (users, XP, activity) |
| `GET` | `/api/admin/challenges` | List all challenges (admin sees full data; public sees active only) |
| `POST` | `/api/admin/challenges` | Create a new challenge (admin only) |
| `PATCH` | `/api/admin/challenges/[id]` | Update challenge fields (admin only) |
| `DELETE` | `/api/admin/challenges/[id]` | Delete a challenge (admin only) |
| `POST` | `/api/admin/challenges/seed` | Seed 20 default challenges (admin, empty-collection guard) |
| `GET` | `/api/admin/users` | Paginated user list (search, sort, filter) |
| `PATCH` | `/api/admin/users/[id]` | Update user (role, XP, ban) — with audit logging |
| `DELETE` | `/api/admin/users/[id]` | Delete user — with audit logging |
| `GET` | `/api/admin/analytics` | Platform-wide analytics, submission-level data, per-challenge success rates |
| `GET` | `/api/admin/audit` | Recent audit log entries |
| `GET` | `/api/admin/export` | CSV export (`?type=users\|analytics\|audit`) |
| `GET` | `/api/auth/oauth/google` | Redirect to Google OAuth consent screen |
| `GET` | `/api/auth/oauth/google/callback` | Google OAuth callback — create/link user + session |
| `GET` | `/api/auth/oauth/github` | Redirect to GitHub OAuth consent screen |
| `GET` | `/api/auth/oauth/github/callback` | GitHub OAuth callback — create/link user + session |
| `GET/POST/PATCH` | `/api/comments` | Challenge discussion comments (get, create, like/unlike) (rate limited: 10/min) |
| `GET/POST/PATCH` | `/api/community/challenges` | Community-built challenges (browse, create, like) |
| `GET/POST` | `/api/duels` | Coding duels (lobby list, create, join, submit, cancel) (rate limited: 10/min) |
| `GET/POST` | `/api/social/follow` | Follow/unfollow users, get follower counts |
| `GET/PATCH/DELETE` | `/api/notifications` | Notification center — list (with unread filter), mark read, delete |
| `GET/POST` | `/api/daily` | Daily & weekly challenges — get today's challenges, submit solution |
| `GET` | `/api/progress` | Full progress dashboard — streak calendar, XP history, achievements, level, breakdown |
| `GET/POST/PATCH/DELETE` | `/api/admin/pools` | Admin CRUD for challenge pools (daily, weekly, duel) + seed defaults |
| `GET` | `/api/duels/stream` | SSE stream for real-time duel arena updates |
| `GET` | `/api/duels/lobby-stream` | SSE stream for real-time duel lobby updates |
| `POST` | `/api/duels/presence` | Update player presence in active duel |
| `POST` | `/api/duels/chat` | Send chat message in active duel |

---

## Deployment (Vercel)

1. Push to GitHub and import the repo in [Vercel](https://vercel.com)
2. Set **Framework Preset** to **Next.js**
3. Add environment variables (`FIREBASE_SERVICE_ACCOUNT`, `GEMINI_API_KEY`, `JWT_SECRET`)
4. Deploy

> All Python execution runs client-side via **Pyodide** — no server-side Python runtime needed.

---

## Security

- **Security headers** — Edge middleware injects `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`, `Referrer-Policy`, and `Permissions-Policy` on every response
- **Route protection** — Middleware redirects unauthenticated users to `/login` on protected routes
- Passwords hashed with **bcrypt** (12 salt rounds) before storing in Firestore
- **Strong password policy** — Requires lowercase, uppercase, digit, and special character (minimum 8 chars)
- Sessions use **JWT** stored in `httpOnly`, `secure`, `sameSite=lax` cookies
- **JWT_SECRET** — Required in production; app throws on startup if missing
- All protected API routes validate auth via `authenticateFromRequest()` middleware
- **XP proof tokens** — HMAC-signed, single-use tokens prevent XP manipulation; nonces stored in Firestore
- **Zod request validation** — All API endpoints validate request bodies with Zod schemas; malformed requests rejected with 400
- **Rate limiting** — Upstash Redis sliding-window limiter (production) with in-memory fallback (dev) on:
  - Auth endpoints (10 req/15min login, 5/15min signup, 5/15min forgot-password)
  - AI mentor hints (5/min)
  - Challenge submissions (20/min)
  - Comments (10/min)
  - Duels (10/min)
  - Notifications (60/min)
  - Daily challenges (30/min GET, 10/min POST)
  - Progress dashboard (30/min)
  - Profile (30/min)
- **Input sanitization** — `sanitizeText()` strips HTML tags and control characters from user input
- XP endpoint validates action types and prevents duplicate full-XP awards for the same challenge
- Admin access controlled via `ADMIN_EMAILS` env variable or Firestore `role: "admin"` field
- Admin pages include `noindex, nofollow` meta to prevent search engine indexing
- Forgot-password identity verification requires matching email + username pair
- **Audit logging** — All admin write actions (user update/delete, challenge CRUD) recorded in Firestore `audit_logs` collection
- Account deletion requires password re-confirmation before executing
- **OAuth 2.0** — Google and GitHub login with PKCE state cookies, automatic user linking by email
- **Error tracking** — Sentry integration (client, server, edge) with source maps, replay, and error filtering
- **Firestore challenge pools** — Daily, weekly, and duel challenges served from admin-managed Firestore pools with 10-min cache and hardcoded fallback
- **PWA** — Service worker with auth-aware caching: protected routes always hit network (never served from cache), cache-first for static assets, network-first for public pages with offline fallback

---

## Accessibility

- **Skip-to-content** link (visible on keyboard focus) on every page
- **`aria-current="page"`** on active navigation links
- **`aria-label`** on all icon-only buttons (sidebar toggle, edit, save, cancel, post comment)
- **`role="alert" aria-live="polite"`** on form validation error messages
- **Reduced motion** — `AnimatedSection` disables animations when `prefers-reduced-motion` is enabled
- Semantic HTML structure with proper heading hierarchy

---

## SEO

- **Dynamic sitemap** (`/sitemap.xml`) generated via `app/sitemap.ts` with all public routes
- **Dynamic robots.txt** (`/robots.txt`) via `app/robots.ts` — blocks `/api/`, `/admin/`, `/settings/`, `/profile/`
- **Per-page metadata** — Every game and section has dedicated `<title>` and `<meta description>` via layout-level `metadata` exports
- **Canonical URL** — Configurable via `NEXT_PUBLIC_SITE_URL` environment variable

---

## Performance

- **next/image** — Optimized image loading with automatic WebP/AVIF serving for avatars
- **API caching** — `Cache-Control` headers on static API routes (leaderboard: 10s, paths: 60s)
- **Static asset caching** — Aggressive cache (`max-age=31536000, immutable`) for `/_next/static/`
- **Code splitting** — Monaco Editor loaded via `next/dynamic` to avoid blocking initial paint
- **Persistent Pyodide worker** — Singleton warm worker pattern pre-warms on mount, reuses across calls, destroys only on timeout; eliminates ~10MB re-download per execution

---

## Admin Panel

The admin panel is accessible at `/admin` for authorized users. Admin access is granted via:

1. **Environment variable** — Add emails to `ADMIN_EMAILS` (comma-separated)
2. **Firestore role** — Set `role: "admin"` on a user document

| Page | Features |
|------|----------|
| Dashboard | 8 KPI cards, top 5 performers, recent signups |
| Challenge Manager | Full CRUD table — create/edit/delete challenges, reorder via drag, toggle active/inactive, one-click seed of 20 defaults, inline form with all challenge fields (description, criteria, rubric, starter code, expected output, steps, mentor instructions, retry help) |
| User Management | Search, sortable columns, pagination, promote/demote/reset XP/delete with confirmation modals, CSV export |
| Analytics | XP distribution, challenge/game/streak distributions, weekly activity heatmap, 30-day signup trend, per-challenge completion counts, CSV export (analytics + audit) |
| Audit Log | Color-coded admin action history, filterable list, CSV export |

Admin users see a red **Admin** link in the navbar. The admin layout uses a distinct red accent theme with a sidebar navigation.

> **Challenges are now fully Firestore-backed.** No hardcoded challenge data — admins can create, edit, reorder, and deactivate challenges at any time from the admin panel. The `POST /api/admin/challenges/seed` endpoint populates the 20 default challenges on first setup.

---

## Changelog

| Date | Change |
|------|--------|
| 2026-03-06 | **Service Worker & Auth Fix** — Rewrote SW (v2) to never cache auth-protected routes (fixes post-login redirect loop on `/ide`, `/gamified`, game pages); removed protected routes from precache list; only cache `200 OK` responses (not redirects); added OAuth token pickup in `PWARegister` (reads `pulsepy_oauth_token` cookie → localStorage); added Google & GitHub OAuth buttons to login/signup pages; removed username from navbar (avatar + level badge only); redesigned daily challenge UI (gradient hero header, single-column stacked layout, inline expected output, taller editor); migrated Sentry to `instrumentation.ts` + `instrumentation-client.ts` (Next.js 15 pattern) |
| 2026-03-05 | **Tier 1 Production Hardening** — Persistent Pyodide worker (singleton warm worker pattern), HMAC-signed XP proof tokens (anti-cheat with Firestore nonce), Zod request validation on all API routes (20+ schemas), Upstash Redis rate limiting with in-memory fallback, Sentry error tracking (client/server/edge), Firestore-backed challenge pools (admin CRUD + seed + 10-min cache), expanded test suite (109 tests across 9 suites — levels, validators, achievements, rateLimit, auth, utils, components), Playwright E2E test setup (10 smoke tests), audit log types extended for pool operations |
| 2026-02-23 | **Progression & Engagement Update** — 15-level progression system (Newbie → Code God) with unique colors & icons, 30-achievement unlock engine (5 rarity tiers, 7 categories, auto-evaluation, Firestore persistence), notification center (bell icon, unread badge, polling, mark-all-read), daily & weekly coding challenges (14 daily + 4 weekly, 2×/3× XP multipliers, deterministic rotation, Pyodide editor), progress dashboard (GitHub-style 365-day streak calendar, 30-day XP bar chart, XP breakdown, filterable achievement grid, level progress bar, milestone feed), level badge in navbar, rarity-colored achievements on profile, session enriched with XP, Badge component extended with `info` variant |
| 2026-02-23 | **Social & Multiplayer Sprint** — Real-time coding duels (lobby, arena, timer, +50 XP), community challenge builder, challenge discussion/comments, social features (follow/friends, share achievements), OAuth login (Google & GitHub), PWA support (manifest, service worker, offline caching), mobile-responsive IDE (collapsible sidebar, touch-friendly editor) |
| 2026-02-22 | **Major Upgrade** — User settings (change password, delete account), code history viewer, learning paths, category/tag filter in IDE, CSV exports on admin pages, dark/light theme toggle, rate limiting on auth endpoints, audit logging, server-side challenge submissions, user profile page, navbar enhancements |
| 2026-02-21 | **Hardening & Polish Sprint** — Security headers middleware, route protection, JWT secret enforcement, rate limiting on 4 more endpoints (hints, submit, comments, duels), strong password policy, input sanitization, toast notifications (replacing all `alert()` calls), route-specific error boundaries (IDE, duels, admin, profile, community), shared `lib/types.ts` (20+ interfaces), `usePyodide` shared hook, SEO sitemap + robots.txt, per-game metadata, admin noindex, PWA offline page, skip-to-content link, aria labels & live regions, reduced-motion support, `next/image` optimization, API caching headers, `Pagination`/`Skeleton`/`Toast`/`UserAvatar` UI components, fixed Jest setup (`setupFilesAfterEnv` typo + missing devDependencies) |
| 2026-02-20 | Added **Admin Challenge Manager** — full CRUD UI + API for Firestore-backed challenges, seed endpoint, active/inactive toggle |
| 2026-02-19 | Initial release — IDE, 5 games, leaderboard, admin dashboard, user management, analytics |

---

## License

MIT
