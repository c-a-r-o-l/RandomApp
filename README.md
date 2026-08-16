# our journey ♡

A cozy, hand-drawn scrapbook PWA for two — a private little corner of the internet to keep thoughts, photos, countdowns and memories.

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

## Running it

```
npm install
npm run dev    # local dev server
npm run build  # production build → dist/
```

To use it yourself, create your own Firebase project and swap the config in `src/data/firebase.js`, then create one email/password user in Firebase Auth. The config in that file is Firebase's public client config — actual data access is enforced by Firestore/Storage security rules, which should restrict reads and writes to authenticated users only.

## Notes

This is a personal project built for one person, shared in case the ideas are useful — issues and PRs may go unanswered while we're busy living the scrapbook. ♡
