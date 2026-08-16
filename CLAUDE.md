# CLAUDE.md

## What this is

"Secret Sketchbook" (`our journey ♡`) — a personal scrapbook PWA for a single user. Deployed to Vercel; auto-deploys on `git push` to `master`.

## Running locally

```
npm run dev    # Vite dev server
npm run build  # production build → dist/
```

No `.env` needed — Firebase config is hardcoded in `src/data/firebase.js` (public config, security enforced via Firestore rules).

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
