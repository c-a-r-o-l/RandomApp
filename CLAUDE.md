# CLAUDE.md

## What this is

"Secret Sketchbook" (`our journey ♡`) — a personal scrapbook PWA for a single user. Deployed to Vercel; auto-deploys on `git push` to `master`.

## Demo deploy

A second, fully separate Vercel deploy + Firebase project for demos — people can click around without ever touching the real data.

- `src/data/firebase.js` reads config from `VITE_FIREBASE_*` env vars, falling back to the hardcoded real project — same codebase runs against either.
- The demo deploy sets `VITE_DEMO_EMAIL`/`VITE_DEMO_PASSWORD`, which adds a one-tap "peek at the demo ♡" button on `LoginScreen` (absent on the real deploy, where the vars aren't set).
- `scripts/seed-demo.mjs` seeds the demo project: creates/logs into the demo user, then writes sample thoughts, photos (SVG doodles), and settings. Idempotent — re-run with `--force` to reseed. A successful run also proves the project is configured (Email/Password provider, rules). Run it with `DEMO_*` env vars (the script prints the Vercel env block + suggested rules at the end).
- Demo Firestore/Storage rules: `allow read, write: if request.auth != null;` — fake data, auth-required keeps random drive-bys out.
- Demo Vercel project: same repo, env vars = the block the seed script prints. Auto-deploys on push like the main one.
- `native/App.js` `APP_URL`: point it at the demo Vercel URL to demo from Expo Go.

## Native wrapper (`native/`)

A minimal Expo (SDK 58, blank JS template) app that shows the deployed site in a full-screen WebView — for opening the app through Expo Go on a phone. **Not** a React Native port: the web app stays untouched; the wrapper just points at it.

- `APP_URL` at the top of `native/App.js` is what it loads (the Vercel deploy; swap in `http://<lan-ip>:5173` to test against the local dev server).
- Run it: `cd native && npx expo start`, then scan the QR code with Expo Go (phone + computer on the same Wi-Fi, or `--tunnel`).

## Running locally

```
npm run dev    # Vite dev server
npm run build  # production build → dist/
```

No `.env` needed — Firebase config is hardcoded in `src/data/firebase.js` (public config, security enforced via Firestore rules), with optional `VITE_FIREBASE_*` env overrides for the demo deploy.

## Tech stack

- **React 19 + Vite 8**, no TypeScript
- **Firebase 12**: Firestore (text data), Storage (images), Auth (email/password)
- **vite-plugin-pwa** (Workbox) — installable as PWA, service-worker auto-update
- Fonts: Gaegu (`SK_FONT.hand`), Caveat (`SK_FONT.script`) from Google Fonts

## File map

```
src/
  main.jsx          entry point, mounts <App>
  App.jsx           auth gate → LoginScreen or AuthedApp; tab shell; data subscriptions
  LoginScreen.jsx   email/password form (signInWithEmailAndPassword)
  Home.jsx          Home tab: relationship counter, heatmap
  Thoughts.jsx      Notes tab: search, tag filter, NoteEditor
  Gallery.jsx       Photos tab: upload, polaroid grid, viewer, bulk select/delete
  Scrapbook.jsx     Scrapbook tab: weekly pages of starred items, swipe navigation
  TweaksPanel.jsx   Floating settings panel + Tweak* controls
  ui.jsx            Shared design system (see below)
  data/
    firebase.js     Init; exports db, storage, auth
    thoughts.js     Firestore CRUD for thoughts collection
    photos.js       Firestore + Storage CRUD for photos collection
    contributions.js Firestore append-only activity log (for heatmap)
    settings.js     Firestore synced-settings doc (settings/app)
```

**All Firebase calls must stay in `src/data/` — never scatter them in components.**

## Auth flow

`App` watches `onAuthStateChanged`: `undefined` = loading splash, `null` = `LoginScreen`, object = `AuthedApp`. Logout is the "bye~" button in the top bar (`signOut`).

## Firestore collections

| Collection | Key fields |
|---|---|
| `thoughts` | `title`, `body`, `tags[]`, `pin`, `scrap`, `hidden`, `color`, `created` (Timestamp), `markedDate` (Timestamp\|null) |
| `photos` | `src` (Storage URL), `caption`, `fav`, `scrap`, `hidden`, `created` (Timestamp), `markedDate` (Timestamp\|null) |
| `contributions` | `date` (YYYY-MM-DD), `type`, `createdAt` (Timestamp) |
| `settings` | single doc `app`: `startISO`, `metISO`, `tags[]`, `countdowns[]`, `hiddenToken` — synced via `useSyncedSettings` in `App.jsx` (localStorage is first-paint cache / migration source) |

Firebase Storage: images at `photos/{id}`. `deletePhoto(id)` removes both the Storage object and the Firestore doc.

## State in localStorage (via `useStored`)

`tab`, `scrapPage`, all tweaks. These are **not** in Firestore — they're device-local. (`startISO`, `metISO`, `tags`, `countdowns`, `hiddenToken` live in the Firestore `settings` doc; their `ss_*` localStorage keys remain as a cache.)

## Shared design system (`src/ui.jsx`)

Named exports only (no globals). Key ones:

- **`SK`** — color palette. Always use these; never hardcode colors.
- **`SK_FONT`** — `SK_FONT.hand`, `SK_FONT.script`, `SK_FONT.mono`
- **`useStored(key, initial)`** — localStorage state hook (keys prefixed `ss_`)
- **`uid()`** — short random ID
- **`paperBg(variant)`** — style object for dot/line/blank paper texture
- **`flatBox(radius, width)`** — flat 2D card border style (no shadow)
- **`miniBtn`** — base style for small action buttons
- **`toDateInput(ts)` / `dateInputToTs(str, fallback)`** — ms ↔ `<input type="date">` value

## Key behaviours

- **Hidden notes**: save a thought with the user's secret word (the `hiddenToken` setting, default `!hidden!`) anywhere in title/body — the token is stripped but `hidden: true` is written to Firestore. Type the same word in the search bar to reveal them; from the revealed view the word can be changed (`HiddenTokenEditor` in `Thoughts.jsx`).
- **Scrapbook**: thoughts and photos with `scrap: true` appear in Scrapbook, grouped by calendar week, 4 items per page.
- **Home layouts**: `card`, `scrapbook`, `journal` — the `homeStyle` tweak in `App.jsx` (`TWEAK_DEFAULTS`, wrapped in `/*EDITMODE-BEGIN*/…/*EDITMODE-END*/` markers).
- **Relationship counter**: `startISO` = "together since", `metISO` = "met on". Synced via the `settings` doc; editable by tapping the counter on the Home tab.
- **Contributions heatmap**: GitHub-style activity grid on Home, fed from the `contributions` Firestore collection.

## Tags

Stored in the Firestore `settings` doc (default `DEFAULT_TAGS`). User-customizable. Defaults defined in `App.jsx`:

| id | name | color |
|---|---|---|
| `t_love` | Important | #7c9560 |
| `t_likes` | About him | #cf8466 |
| `t_date` | Memory | #7fa6ac |
| `t_gift` | Random thoughts | #b89bd1 |
| `t_crash` | Appreciation | #df9a9a |
| `t_random` | Ideas | #a9794f |

When a tag is deleted, `removeTagFromThoughts` batch-updates all thoughts to remove it from their `tags[]`.
