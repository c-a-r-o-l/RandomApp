# our journey ♡

A cozy, hand-drawn scrapbook PWA for two — a private little corner of the internet to keep thoughts, photos, countdowns and memories.

**Live demo** → [random-app-demo-eta.vercel.app](https://random-app-demo-eta.vercel.app) — a separate deployment seeded with sample data; tap *peek at the demo ♡* on the login screen.

## Features

- **Home** — relationship counter (years / months / days, flip-clock style), custom countdown calendars, a GitHub-style contributions heatmap of scrapbook activity, and a squirrel mascot that repeats your important thoughts back to you
- **Thoughts** — sticky-note style journal with tags, colours, pinning, search, and a secret word that hides notes until you type it in the search bar
- **Photos** — polaroid-grid gallery backed by Firebase Storage
- **Scrapbook** — starred thoughts and photos laid out as weekly scrapbook pages with washi tape
- Installable as a PWA, syncs across devices via Firestore

## Stack

- React 19 + Vite, no TypeScript
- Firebase: Firestore (notes & settings), Storage (photos), Auth (email/password, single user — no sign-up flow)
- vite-plugin-pwa (Workbox)

## Where the interesting code lives

The whole repo is ~3.3k lines of source with no framework boilerplate — readable in one sitting:

- **`src/App.jsx`** — auth gate, tab shell, and settings sync (Firestore is the source of truth, localStorage is the first-paint cache)
- **`src/data/`** — every Firebase call in the app lives here (CRUD + snapshot subscriptions); components never touch the SDK directly
- **`src/Scrapbook.jsx`** — weekly pages: entries grouped by ISO week, rows packed by measured photo aspect ratio (wide photos take a full row), swipe navigation with drag physics and a date-jump calendar
- **`src/Home.jsx`** — relationship counter, custom countdowns, and a GitHub-style activity heatmap with streak math
- **`src/Thoughts.jsx`** — tag system, search, and the hidden-notes secret word (type it in the search bar to reveal)
- **`src/Gallery.jsx`** — client-side image compression via `exifr`, polaroid grid, bulk select/delete
- **`scripts/seed-demo.mjs`** — idempotent seeder for the demo environment; together with the env-driven config in `src/data/firebase.js`, it lets the same codebase run against a separate demo Firebase project so a public demo never touches private data

## Running it

```
npm install
npm run dev    # local dev server
npm run build  # production build → dist/
```

To use it yourself, create your own Firebase project, point at it with `VITE_FIREBASE_*` env vars (`src/data/firebase.js` falls back to the original project), then create one email/password user in Firebase Auth. The config is Firebase's public client config — actual data access is enforced by Firestore/Storage security rules, which should restrict reads and writes to authenticated users only.

## On your phone (Expo Go)

`native/` holds a tiny Expo wrapper that shows the deployed app in a full-screen WebView — not a native port, just the website in an app shell. To try it: `cd native && npx expo start`, then scan the QR code with Expo Go.

## Notes

This is a personal project built for one person, shared in case the ideas are useful — issues and PRs may go unanswered while we're busy living the scrapbook. ♡
