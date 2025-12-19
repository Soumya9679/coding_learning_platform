# PulsePy · AI-Powered Gamified Python Learning IDE

PulsePy delivers a Gen-Z ready learning playground that mixes a Monaco-based IDE, AI mentor hints powered by Gemini + GPT-5.1-Codex-Max guidance, and Firebase-ready backend hooks. The experience is intentionally split into three focused pages (dashboard, challenges, IDE, Game Lab) to keep first-time coders confident.

## Project structure

```
public/
  index.html          # Dashboard hub with hero CTA and quick sections
  challenges.html     # Challenge galaxy with hint tiers
  ide.html            # Monaco editor, console panel, mentor feed
  gamified.html       # Game mechanics + tone switcher
  styles/             # base + page-specific styles
  scripts/            # lightweight interactivity modules
functions/
  index.js            # Firebase callable function stub for mentor hints
  package.json
firebase.json         # Hosting + Functions config
```

## Getting started

1. **Install dependencies** for Cloud Functions (optional for static preview):
   ```powershell
   cd functions; npm install
   ```
2. **Serve locally** with Firebase emulators:
   ```powershell
   firebase emulators:start
   ```
3. **Static preview** without Firebase:
   - Use any static server to open `public/` (for example `npx serve public`).

## Frontend highlights

- Expressive Space Grotesk typography, liquid gradients, and floating cards for motion.
- Dashboard hero emphasizes login/signup, stats, and AI mentor callouts.
- Dedicated pages for challenges, IDE, and gamified mechanics keep focus clear.
- Monaco editor is loaded via CDN with a simulated run + Gemini hint loop ready to hook into the Cloud Function.

## Backend + AI notes

- `functions/index.js` exposes a callable `mentorHint` Cloud Function designed to be replaced with real Gemini + GPT-5.1-Codex-Max orchestration.
- Replace the heuristic with actual API calls once credentials are configured (e.g., via Google AI Studio or Vertex AI + secret manager).

## Next steps

1. Wire `scripts/ide.js` to call the callable function when running code.
2. Connect Firebase Auth to the login/signup actions for real sessions.
3. Expand `gamified.html` with live streak data once Firestore is integrated.

The project intentionally keeps assets and dependencies lightweight so you can iterate rapidly on the learning mechanics while still showcasing the animated, professional Gen-Z aesthetic.
