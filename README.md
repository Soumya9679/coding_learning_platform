# PulsePy - AI-Powered Python Learning Platform

PulsePy is a production-style coding education platform built with **Next.js 15**, **React 19**, **TypeScript**, and **Tailwind CSS v4**.

The platform combines interactive Python practice with a polished web application experience. Learners can solve graded challenges in a live IDE powered by Pyodide, request AI mentor hints, compete on a real-time leaderboard, participate in coding duels, create community challenges, and build momentum through multiple gamified learning modes.

PulsePy also includes a full admin experience for challenge management, user operations, analytics, and audit visibility. Additional platform features include OAuth login, PWA support, social interactions, a progression system with titles and achievements, and a progress dashboard with activity tracking.

---

## Overview

- 20 graded Python challenges in a live browser IDE
- AI mentor hints powered by Google Gemini
- Real-time leaderboard with XP, levels, and achievements
- Five gamified learning experiences with distinct mechanics
- Daily and weekly challenges with XP multipliers
- Real-time coding duels and community-built challenges
- Admin panel for content management, analytics, and moderation
- OAuth login, notification center, social features, and PWA support

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
| SEO | Dynamic sitemap and robots.txt via Next.js Metadata API |
| Fonts | Space Grotesk + JetBrains Mono via `next/font` |

---

## Core Features

| Feature | Route | Description |
|---------|-------|-------------|
| Landing Page | `/` | Hero section, stats, feature grid, and CTAs |
| Sign Up | `/signup` | Five-field registration with real-time validation and password strength feedback |
| Log In | `/login` | Email or username authentication with password visibility toggle and forgot-password link |
| Forgot Password | `/forgot-password` | Identity-verified password reset using email and username |
| Live IDE | `/ide` | Firestore-backed challenges, Pyodide runtime, progress bar, timer, filters, AI mentor hints, and challenge discussion |
| Learning Paths | `/paths` | Topic-based challenge sequences with per-path and overall progress tracking |
| Leaderboard | `/leaderboard` | Dynamic Firestore rankings, personal stats, achievements, XP guidance, and social actions |
| Game Lab | `/gamified` | Hub that links to all five learning games |
| Profile | `/profile` | User profile with stats, rank, achievements, submissions, and editable display name |
| Code History | `/history` | Submission browser with challenge filters, pagination, expandable code view, and copy support |
| Settings | `/settings` | Password change flow and account deletion with confirmation |
| Syntax Sniper | `/game1` | Timed typing game with per-character accuracy, WPM, and 30 snippets across 3 difficulty tiers (+XP) |
| Pipeline Puzzle | `/game2` | Reorder shuffled code lines into the correct solution sequence across 20 puzzles (+XP) |
| Velocity Trials | `/game3` | Python output racing game with powerups, laps, and 25 questions (+XP) |
| Memory Matrix | `/game4` | Match Python concepts to code across 24 pairs and multiple grid sizes (+XP) |
| Code Cascade | `/game5` | Type outputs to clear falling Python expressions in combo-based waves (+XP) |
| Admin Dashboard | `/admin` | KPI cards, top performers, and recent signups |
| Challenge Manager | `/admin/challenges` | Full CRUD for IDE challenges, including ordering, activation, seeding, and deletion |
| User Management | `/admin/users` | Search, sorting, pagination, moderation actions, and CSV export |
| Analytics | `/admin/analytics` | Platform analytics, distributions, trends, challenge breakdowns, and CSV export |
| Audit Log | `/admin/audit` | Review admin actions with color coding, refresh support, and CSV export |
| Community Challenges | `/community` | Browse, create, like, filter, and play community-built challenges |
| Coding Duels | `/duels` | Head-to-head coding matches with lobby, matchmaking, timer, and winner XP |
| Daily Challenges | `/daily` | Daily and weekly coding challenges with countdowns, deterministic rotation, and XP multipliers |
| Progress Dashboard | `/progress` | 365-day streak calendar, 30-day XP chart, breakdowns, achievements, and level progress |
| Notification Center | Navbar | Bell dropdown with unread counts, polling, mark-all-read, and notification categories |
| User Levels & Titles | Navbar / Profile | 15-level progression system with titles, colors, icons, progress bars, and level-up notifications |
| Achievement System | Profile / Progress | 30 achievements across 7 categories and 5 rarity tiers with automatic evaluation |
| Social Features | `/leaderboard` | Follow and unfollow users, friends-only filtering, and achievement sharing |
| Challenge Discussion | `/ide` | Challenge comments, likes, and threaded discussion |
| OAuth Login | `/login`, `/signup` | Google and GitHub sign-in alongside email/password auth |
| PWA Support | - | Installable app with service worker, offline caching, manifest, and offline page |
| Dark/Light Theme | - | Theme toggle persisted in localStorage |
| Offline Page | `/offline` | Fallback page when connectivity is lost |

---

## Game Mechanics

Each game teaches Python through a different interaction pattern.

| Game | Mechanic | Content |
|------|----------|---------|
| Syntax Sniper | Real-time typing with accuracy highlighting | 30 Python snippets |
| Pipeline Puzzle | Drag-sort shuffled code lines into order | 20 code arrangement puzzles |
| Velocity Trials | Racing with streak-earned powerups | 25 output questions |
| Memory Matrix | Timed card-matching of concept and code | 24 concept/code pairs |
| Code Cascade | Action typing with falling expressions | 55 Python expressions |

---

## Project Structure

```text
coding_learning_platform/
|-- app/
|   |-- layout.tsx              # Root layout (fonts, navbar, metadata, skip-to-content)
|   |-- page.tsx                # Landing page (hero, stats, features)
|   |-- loading.tsx             # Global loading spinner
|   |-- error.tsx               # Global error boundary
|   |-- not-found.tsx           # Custom 404 page
|   |-- sitemap.ts              # Dynamic sitemap.xml (Next.js Metadata API)
|   |-- robots.ts               # Dynamic robots.txt (Next.js Metadata API)
|   |-- globals.css             # Tailwind v4 @theme tokens + base styles
|   |-- login/
|   |   |-- layout.tsx
|   |   `-- page.tsx            # Login with show/hide password toggle
|   |-- signup/
|   |   |-- layout.tsx
|   |   `-- page.tsx            # Real-time field validation, inline password strength
|   |-- forgot-password/
|   |   |-- layout.tsx
|   |   `-- page.tsx            # Identity-verified password reset
|   |-- ide/
|   |   |-- layout.tsx
|   |   |-- error.tsx           # IDE-specific error boundary
|   |   `-- page.tsx            # Challenges, Monaco editor, Pyodide, AI mentor, filters
|   |-- leaderboard/
|   |   `-- page.tsx            # Dynamic rankings, achievements, XP breakdown
|   |-- profile/
|   |   |-- layout.tsx
|   |   |-- error.tsx           # Profile error boundary
|   |   `-- page.tsx            # User profile - stats, achievements, recent submissions
|   |-- settings/
|   |   |-- layout.tsx
|   |   `-- page.tsx            # Change password, delete account
|   |-- history/
|   |   |-- layout.tsx
|   |   `-- page.tsx            # Code history with code viewer and filters
|   |-- paths/
|   |   |-- layout.tsx
|   |   `-- page.tsx            # Topic-based learning paths
|   |-- community/
|   |   |-- layout.tsx
|   |   |-- error.tsx           # Community error boundary
|   |   `-- page.tsx            # Community challenge builder and browser
|   |-- duels/
|   |   |-- layout.tsx
|   |   |-- error.tsx           # Duels error boundary
|   |   `-- page.tsx            # Real-time coding duels
|   |-- daily/
|   |   |-- layout.tsx
|   |   |-- loading.tsx         # Skeleton loading state
|   |   |-- error.tsx           # Daily error boundary
|   |   `-- page.tsx            # Daily and weekly challenges
|   |-- progress/
|   |   |-- layout.tsx
|   |   |-- loading.tsx         # Skeleton loading state
|   |   |-- error.tsx           # Progress error boundary
|   |   `-- page.tsx            # Progress dashboard
|   |-- offline/page.tsx        # PWA offline fallback page
|   |-- gamified/
|   |   |-- layout.tsx          # SEO metadata for game hub
|   |   `-- page.tsx            # Game Lab hub
|   |-- game1/
|   |   |-- layout.tsx          # SEO metadata
|   |   `-- page.tsx            # Syntax Sniper
|   |-- game2/
|   |   |-- layout.tsx          # SEO metadata
|   |   `-- page.tsx            # Pipeline Puzzle
|   |-- game3/
|   |   |-- layout.tsx          # SEO metadata
|   |   `-- page.tsx            # Velocity Trials
|   |-- game4/
|   |   |-- layout.tsx          # SEO metadata
|   |   `-- page.tsx            # Memory Matrix
|   |-- game5/
|   |   |-- layout.tsx          # SEO metadata
|   |   `-- page.tsx            # Code Cascade
|   |-- admin/
|   |   |-- layout.tsx          # Admin layout + AdminGuard + noindex
|   |   |-- error.tsx           # Admin error boundary
|   |   |-- page.tsx            # Admin dashboard
|   |   |-- challenges/page.tsx # Challenge CRUD manager
|   |   |-- users/page.tsx      # User management
|   |   |-- analytics/page.tsx  # Analytics and CSV export
|   |   `-- audit/page.tsx      # Audit log viewer
|   `-- api/
|       |-- health/route.ts
|       |-- auth/
|       |   |-- signup/route.ts
|       |   |-- login/route.ts
|       |   |-- logout/route.ts
|       |   |-- session/route.ts
|       |   |-- forgot-password/route.ts
|       |   `-- oauth/
|       |       |-- google/route.ts
|       |       |-- google/callback/route.ts
|       |       |-- github/route.ts
|       |       `-- github/callback/route.ts
|       |-- admin/
|       |   |-- check/route.ts
|       |   |-- stats/route.ts
|       |   |-- challenges/route.ts
|       |   |-- challenges/[challengeId]/route.ts
|       |   |-- challenges/seed/route.ts
|       |   |-- users/route.ts
|       |   |-- users/[userId]/route.ts
|       |   |-- analytics/route.ts
|       |   |-- audit/route.ts
|       |   `-- export/route.ts
|       |-- challenges/submit/route.ts
|       |-- profile/route.ts
|       |-- settings/route.ts
|       |-- submissions/route.ts
|       |-- paths/route.ts
|       |-- comments/route.ts
|       |-- community/challenges/route.ts
|       |-- duels/route.ts
|       |-- social/follow/route.ts
|       |-- notifications/route.ts
|       |-- daily/route.ts
|       |-- progress/route.ts
|       |-- leaderboard/
|       |   |-- route.ts
|       |   |-- me/route.ts
|       |   `-- xp/route.ts
|       `-- mentorHint/route.ts
|-- components/
|   |-- Navbar.tsx
|   |-- NotificationBell.tsx
|   |-- AuthGuard.tsx
|   |-- AdminGuard.tsx
|   |-- ThemeToggle.tsx
|   |-- ThemeHydrator.tsx
|   |-- PWARegister.tsx
|   `-- ui/
|-- hooks/
|   |-- usePyodide.ts
|   |-- useDuelStream.ts
|   `-- useLobbyStream.ts
|-- lib/
|   |-- auth.ts
|   |-- admin.ts
|   |-- firebase.ts
|   |-- session.ts
|   |-- gemini.ts
|   |-- store.ts
|   |-- themeStore.ts
|   |-- levels.ts
|   |-- achievements.ts
|   |-- rateLimit.ts
|   |-- validators.ts
|   |-- xpToken.ts
|   |-- duelStore.ts
|   |-- auditLog.ts
|   |-- types.ts
|   `-- utils.ts
|-- middleware.ts
|-- __tests__/
|-- e2e/
|-- public/
|-- jest.config.ts
|-- jest.setup.ts
|-- playwright.config.ts
|-- instrumentation.ts
|-- instrumentation-client.ts
|-- tsconfig.json
|-- next.config.ts
|-- postcss.config.mjs
`-- package.json
```

---

## XP, Levels, and Leaderboard

Users earn XP through challenges, mini-games, duels, daily challenges, and streaks. Progress and ranking data are stored in Firestore and reflected throughout the platform.

### XP Awards

| Action | XP Awarded |
|--------|------------|
| Complete a challenge | +100 XP |
| First-try challenge success | +150 XP |
| Repeat a completed challenge | +25 XP (25%) |
| Complete a mini-game | +50 XP |
| Perfect game score (no mistakes) | +100 XP |
| Win a coding duel | +50 XP |
| Daily login streak | +25 XP |
| Daily challenge (correct) | Base XP x 2 |
| Weekly challenge (correct) | Base XP x 3 |

### User Levels (15 Tiers)

| Level | Title | XP Required |
|-------|-------|-------------|
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

Level-up events trigger in-app notifications and appear in the progress dashboard milestone feed.

### Achievements (30 Total, 5 Rarity Tiers)

Achievements are evaluated automatically when XP-related events are processed and are stored persistently in Firestore.

| Rarity | Color | Count | Example |
|--------|-------|-------|---------|
| Common | Zinc | 6 | First Steps (earn 10 XP) |
| Uncommon | Green | 8 | Challenge Accepted (complete 5 challenges) |
| Rare | Blue | 7 | Hot Streak (7-day streak) |
| Epic | Purple | 6 | Top 10 (reach leaderboard top 10) |
| Legendary | Amber | 3 | Immortal Flame (100-day streak) |

Categories: **XP**, **Challenge**, **Streak**, **Game**, **Social/Duels**, **Rank**, **Special**

### Daily and Weekly Challenges

- 14 daily challenges rotated deterministically by date
- 4 weekly challenges with harder topics such as Merge Sort, BST, LRU Cache, and Graph BFS
- Daily challenges award a 2x XP multiplier
- Weekly challenges award a 3x XP multiplier
- Each challenge can only be completed once per rotation period
- Completion count is tracked globally across all users

---

## Getting Started

### Prerequisites

- Node.js >= 18
- A Firebase project with Firestore enabled
- A Google Gemini API key

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your values:

| Variable | Required | Description |
|----------|----------|-------------|
| `FIREBASE_SERVICE_ACCOUNT` | Yes | Firebase service-account JSON (stringified) |
| `GEMINI_API_KEY` | Yes | Google Generative Language API key |
| `JWT_SECRET` | Yes (prod) | Random string used to sign JWTs and XP tokens. Required in production; development uses a fallback |
| `GEMINI_MODEL` | Optional | Gemini model name (default: `gemini-2.5-flash`) |
| `ADMIN_EMAILS` | Optional | Comma-separated admin emails such as `admin@example.com` |
| `GOOGLE_CLIENT_ID` | Optional | Google OAuth 2.0 client ID |
| `GOOGLE_CLIENT_SECRET` | Optional | Google OAuth 2.0 client secret |
| `GITHUB_CLIENT_ID` | Optional | GitHub OAuth App client ID |
| `GITHUB_CLIENT_SECRET` | Optional | GitHub OAuth App client secret |
| `UPSTASH_REDIS_REST_URL` | Optional | Upstash Redis URL for distributed rate limiting |
| `UPSTASH_REDIS_REST_TOKEN` | Optional | Upstash Redis auth token |
| `NEXT_PUBLIC_SENTRY_DSN` | Optional | Sentry DSN for client-side error tracking |
| `SENTRY_ORG` | Optional | Sentry organization slug for source map uploads |
| `SENTRY_PROJECT` | Optional | Sentry project slug |
| `SENTRY_AUTH_TOKEN` | Optional | Sentry auth token for source map uploads |
| `NEXT_PUBLIC_SITE_URL` | Optional | Canonical site URL for sitemap and robots metadata (default: `https://pulsepy.tech`) |

### 3. Run the Dev Server

```bash
npm run dev
```

Open `http://localhost:3000`.

### 4. Run Tests

```bash
npm test
npm run test:watch
npm run test:coverage
npm run test:e2e
npm run test:e2e:ui
```

Notes:

- `npm test` runs all Jest tests (109 tests across 9 suites)
- Playwright E2E requires `npx playwright install`

### 5. Build for Production

```bash
npm run build
npm start
```

---

## API Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check (`{ status: "ok" }`) |
| `POST` | `/api/auth/signup` | Register a new user (rate limited: 5/15m) |
| `POST` | `/api/auth/login` | Authenticate a user (rate limited: 10/15m) |
| `POST` | `/api/auth/logout` | Clear session cookie |
| `GET` | `/api/auth/session` | Validate JWT session |
| `POST` | `/api/auth/forgot-password` | Reset password (rate limited: 5/15m) |
| `GET` | `/api/leaderboard` | Global rankings (top 50, sorted by XP) |
| `GET` | `/api/leaderboard/me` | Current user stats and calculated rank |
| `POST` | `/api/leaderboard/xp` | Award XP (`challenge_complete`, `game_complete`, etc.) |
| `POST` | `/api/challenges/submit` | Submit challenge solution with validation and XP award (rate limited: 20/min) |
| `GET` | `/api/profile` | Full user profile, stats, achievements, and recent submissions |
| `PATCH` | `/api/profile` | Update display name |
| `PATCH` | `/api/settings` | Change password |
| `DELETE` | `/api/settings` | Delete the current account after password confirmation |
| `GET` | `/api/submissions` | Browse past submissions with optional challenge filter |
| `GET` | `/api/paths` | Learning paths derived from challenge tags and user progress |
| `POST` | `/api/mentorHint` | Request an AI mentor hint for the active challenge (rate limited: 5/min) |
| `GET` | `/api/admin/check` | Check whether the current user is an admin |
| `GET` | `/api/admin/stats` | Dashboard aggregates for users, XP, and activity |
| `GET` | `/api/admin/challenges` | List all challenges; public users see active items only |
| `POST` | `/api/admin/challenges` | Create a new challenge (admin only) |
| `PATCH` | `/api/admin/challenges/[id]` | Update challenge fields (admin only) |
| `DELETE` | `/api/admin/challenges/[id]` | Delete a challenge (admin only) |
| `POST` | `/api/admin/challenges/seed` | Seed 20 default challenges (admin only, empty-collection guard) |
| `GET` | `/api/admin/users` | Paginated user list with search, sort, and filter support |
| `PATCH` | `/api/admin/users/[id]` | Update user role, XP, or ban state with audit logging |
| `DELETE` | `/api/admin/users/[id]` | Delete user with audit logging |
| `GET` | `/api/admin/analytics` | Platform analytics, submission-level data, and challenge success rates |
| `GET` | `/api/admin/audit` | Recent audit log entries |
| `GET` | `/api/admin/export` | CSV export (`?type=users|analytics|audit`) |
| `GET` | `/api/auth/oauth/google` | Redirect to the Google OAuth consent screen |
| `GET` | `/api/auth/oauth/google/callback` | Google OAuth callback to create or link user and session |
| `GET` | `/api/auth/oauth/github` | Redirect to the GitHub OAuth consent screen |
| `GET` | `/api/auth/oauth/github/callback` | GitHub OAuth callback to create or link user and session |
| `GET/POST/PATCH` | `/api/comments` | Challenge discussion comments, creation, and like/unlike actions |
| `GET/POST/PATCH` | `/api/community/challenges` | Browse, create, and like community-built challenges |
| `GET/POST` | `/api/duels` | Create, join, submit, and cancel coding duels |
| `GET/POST` | `/api/social/follow` | Follow or unfollow users and retrieve follower counts |
| `GET/PATCH/DELETE` | `/api/notifications` | List, mark read, and delete notifications |
| `GET/POST` | `/api/daily` | Get current daily/weekly challenges and submit solutions |
| `GET` | `/api/progress` | Full progress dashboard with streak, XP history, level, and achievements |
| `GET/POST/PATCH/DELETE` | `/api/admin/pools` | Admin CRUD for challenge pools (daily, weekly, duel) |
| `GET` | `/api/duels/stream` | SSE stream for duel arena updates |
| `GET` | `/api/duels/lobby-stream` | SSE stream for duel lobby updates |
| `POST` | `/api/duels/presence` | Update player presence in an active duel |
| `POST` | `/api/duels/chat` | Send chat messages in an active duel |

---

## Deployment (Vercel)

1. Push the repository to GitHub and import it into [Vercel](https://vercel.com)
2. Set the framework preset to **Next.js**
3. Add the required environment variables: `FIREBASE_SERVICE_ACCOUNT`, `GEMINI_API_KEY`, and `JWT_SECRET`
4. Deploy

All Python execution runs client-side through **Pyodide**, so no server-side Python runtime is required.

---

## Security

- Edge middleware adds security headers including `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`, `Referrer-Policy`, and `Permissions-Policy`
- Protected routes redirect unauthenticated users to `/login`
- Passwords are hashed with bcrypt using 12 salt rounds before storage
- Strong password policy requires lowercase, uppercase, digit, and special character with a minimum length of 8
- Sessions use JWTs stored in `httpOnly`, `secure`, `sameSite=lax` cookies
- `JWT_SECRET` is required in production
- Protected API routes validate auth through `authenticateFromRequest()`
- XP proof tokens are HMAC-signed, single-use, and backed by Firestore nonces
- All API request bodies are validated with Zod
- Rate limiting is enforced across auth, hints, submissions, comments, duels, notifications, daily challenges, progress, and profile endpoints
- `sanitizeText()` strips HTML tags and control characters from user input
- XP actions are validated to prevent duplicate full-XP awards for the same challenge
- Admin access is controlled via `ADMIN_EMAILS` or a Firestore `role: "admin"` field
- Admin pages are marked `noindex, nofollow`
- Forgot-password verification requires a matching email and username pair
- All admin write actions are recorded in the Firestore `audit_logs` collection
- Account deletion requires password re-confirmation
- Google and GitHub OAuth flows use PKCE state cookies and automatic account linking by email
- Sentry provides client, server, and edge error tracking
- Daily, weekly, and duel pools are served from admin-managed Firestore pools with cache and hardcoded fallback support
- The PWA service worker uses auth-aware caching so protected routes are always served from the network

### Rate Limits

- Auth endpoints: 10 requests / 15 minutes for login, 5 / 15 minutes for signup, 5 / 15 minutes for forgot-password
- AI mentor hints: 5 / minute
- Challenge submissions: 20 / minute
- Comments: 10 / minute
- Duels: 10 / minute
- Notifications: 60 / minute
- Daily challenges: 30 / minute for `GET`, 10 / minute for `POST`
- Progress dashboard: 30 / minute
- Profile: 30 / minute

---

## Accessibility

- Skip-to-content link visible on keyboard focus
- `aria-current="page"` on active navigation links
- `aria-label` on icon-only controls
- `role="alert"` and `aria-live="polite"` on validation messages
- Reduced-motion support in `AnimatedSection`
- Semantic HTML structure with consistent heading hierarchy

---

## SEO

- Dynamic sitemap at `/sitemap.xml` generated via `app/sitemap.ts`
- Dynamic robots file at `/robots.txt` generated via `app/robots.ts`
- Per-page metadata through route-level `metadata` exports
- Canonical URL configurable with `NEXT_PUBLIC_SITE_URL`

---

## Performance

- `next/image` for optimized image loading and modern formats
- `Cache-Control` headers on static API routes such as leaderboard and paths
- Long-lived immutable caching for `/_next/static/`
- Code splitting for the editor to reduce initial paint cost
- Persistent Pyodide worker with warm-worker reuse to avoid repeated runtime downloads

---

## Admin Panel

The admin panel is available at `/admin` for authorized users.

Admin access can be granted in two ways:

1. Add user emails to `ADMIN_EMAILS`
2. Set `role: "admin"` on a Firestore user document

| Page | Features |
|------|----------|
| Dashboard | 8 KPI cards, top 5 performers, and recent signups |
| Challenge Manager | Full CRUD table with create, edit, delete, reorder, activate/deactivate, and one-click seeding of 20 defaults |
| User Management | Search, sortable columns, pagination, moderation actions, and CSV export |
| Analytics | XP distribution, challenge/game/streak distributions, weekly activity heatmap, 30-day signup trend, and CSV export |
| Audit Log | Color-coded admin action history, filtering, and CSV export |

Challenge content is fully Firestore-backed. Administrators can create, edit, reorder, and deactivate challenges without changing source code. The `POST /api/admin/challenges/seed` endpoint can populate the default 20 challenges during initial setup.

---

## Changelog

| Date | Change |
|------|--------|
| 2026-03-06 | **Service Worker & Auth Fix** - Rewrote the service worker to avoid caching auth-protected routes, removed protected routes from the precache list, cached only `200 OK` responses, added OAuth token pickup in `PWARegister`, added Google and GitHub OAuth buttons to login/signup pages, removed username from the navbar, redesigned the daily challenge UI, and migrated Sentry to `instrumentation.ts` and `instrumentation-client.ts` |
| 2026-03-05 | **Tier 1 Production Hardening** - Added persistent Pyodide worker reuse, HMAC-signed XP proof tokens, Zod validation across API routes, Upstash Redis rate limiting with in-memory fallback, Sentry integration, Firestore-backed challenge pools, expanded tests, Playwright E2E setup, and audit log type updates |
| 2026-02-23 | **Progression & Engagement Update** - Added the 15-level progression system, 30-achievement engine, notification center, daily/weekly coding challenges, progress dashboard, level badge in navbar, rarity-colored achievements on profile, and session XP enrichment |
| 2026-02-23 | **Social & Multiplayer Sprint** - Added real-time coding duels, community challenge builder, comments, social features, OAuth login, PWA support, and a mobile-responsive IDE |
| 2026-02-22 | **Major Upgrade** - Added user settings, code history, learning paths, IDE filtering, admin CSV exports, dark/light theme toggle, auth rate limiting, audit logging, server-side challenge submissions, user profile page, and navbar enhancements |
| 2026-02-21 | **Hardening & Polish Sprint** - Added security headers, route protection, JWT secret enforcement, expanded rate limiting, stronger password rules, input sanitization, toast notifications, route-specific error boundaries, shared types, `usePyodide`, sitemap/robots support, admin noindex, offline page, accessibility improvements, image optimization, API caching headers, reusable UI components, and Jest setup fixes |
| 2026-02-20 | Added the **Admin Challenge Manager** with full CRUD UI and API support for Firestore-backed challenges |
| 2026-02-19 | Initial release with IDE, five games, leaderboard, admin dashboard, user management, and analytics |

---

## License

MIT
