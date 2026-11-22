// Seeds the demo Firebase project with sample data so the app looks alive
// without exposing any real content. Idempotent — re-run with --force to reseed.
//
// Usage (all env vars required):
//   DEMO_API_KEY=… DEMO_AUTH_DOMAIN=… DEMO_PROJECT_ID=… DEMO_STORAGE_BUCKET=… \
//   DEMO_APP_ID=… DEMO_EMAIL=… DEMO_PASSWORD=… \
//   node scripts/seed-demo.mjs
//
// A successful run also proves the demo project is configured correctly:
// Email/Password provider enabled (user created/logged in), Firestore + Storage
// rules allowing the demo user (docs written, images uploaded).
import { initializeApp } from 'firebase/app';
import {
  createUserWithEmailAndPassword, signInWithEmailAndPassword, getAuth,
} from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, Timestamp } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const required = [
  'DEMO_API_KEY', 'DEMO_AUTH_DOMAIN', 'DEMO_PROJECT_ID',
  'DEMO_STORAGE_BUCKET', 'DEMO_APP_ID', 'DEMO_EMAIL', 'DEMO_PASSWORD',
];
const missing = required.filter(k => !process.env[k]);
if (missing.length) {
  console.error(`Missing env vars: ${missing.join(', ')}`);
  console.error('(You can grab all of these from the demo project in the Firebase console — see CLAUDE.md → "Demo deploy".)');
  process.exit(1);
}

const app = initializeApp({
  apiKey: process.env.DEMO_API_KEY,
  authDomain: process.env.DEMO_AUTH_DOMAIN,
  projectId: process.env.DEMO_PROJECT_ID,
  storageBucket: process.env.DEMO_STORAGE_BUCKET,
  messagingSenderId: process.env.DEMO_MESSAGING_SENDER_ID || '',
  appId: process.env.DEMO_APP_ID,
});
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// ── auth: create the demo user if it doesn't exist, then sign in ──────────
const email = process.env.DEMO_EMAIL;
const password = process.env.DEMO_PASSWORD;
try {
  await createUserWithEmailAndPassword(auth, email, password);
  console.log('✓ created demo user');
} catch (e) {
  if (e.code === 'auth/email-already-in-use') {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      console.log('✓ demo user already exists — signed in');
    } catch {
      console.error(
        `\n✗ "${email}" already exists in this project, but the password doesn't match.\n` +
        `  Fix: Firebase console → Build → Authentication → Users → delete "${email}",\n` +
        `  then re-run this script. (Or reset that user's password to "${password}".)\n`
      );
      process.exit(1);
    }
  } else if (e.code === 'auth/operation-not-allowed') {
    console.error(
      '\n✗ Email/Password sign-in is not enabled in the demo project.\n' +
      '  Fix: Firebase console → Build → Authentication → Sign-in method → Email/Password → Enable.\n'
    );
    process.exit(1);
  } else if (e.code === 'auth/weak-password') {
    console.error('\n✗ Password too short — Firebase needs at least 6 characters.\n');
    process.exit(1);
  } else {
    throw e;
  }
}

// ── idempotency guard ──────────────────────────────────────────────────────
const settingsRef = doc(db, 'settings', 'app');
if ((await getDoc(settingsRef)).exists() && !process.argv.includes('--force')) {
  console.log('Demo already seeded (settings/app exists). Re-run with --force to reseed.');
  process.exit(0);
}

const now = Date.now();
const daysAgo = n => Timestamp.fromMillis(now - n * 86400000);
const daysAhead = n => new Date(now + n * 86400000);

// ── settings ───────────────────────────────────────────────────────────────
const DEMO_TAGS = [
  { id: 't_love',   name: 'Important',        color: '#7c9560' },
  { id: 't_likes',  name: 'About him',        color: '#cf8466' },
  { id: 't_date',   name: 'Memory',           color: '#7fa6ac' },
  { id: 't_gift',   name: 'Random thoughts',  color: '#b89bd1' },
  { id: 't_crash',  name: 'Appreciation',     color: '#df9a9a' },
  { id: 't_random', name: 'Ideas',            color: '#a9794f' },
];
const cd = n => ({ month: daysAhead(n).getMonth(), day: daysAhead(n).getDate() });

await setDoc(settingsRef, {
  startISO: new Date(now - 730 * 86400000).toISOString(),   // together ~2 years
  metISO: new Date(now - 1100 * 86400000).toISOString(),    // met ~3 years ago
  tags: DEMO_TAGS,
  countdowns: [
    { id: 'demo-picnic', name: 'picnic day', ...cd(12) },
    { id: 'demo-marathon', name: 'movie marathon', ...cd(36) },
  ],
  hiddenToken: '!hidden!',
});
console.log('✓ settings');

// ── thoughts ───────────────────────────────────────────────────────────────
const thoughts = [
  { id: 'demo-note-pancakes', title: 'pancake morning', body: 'he flipped one onto the floor and we still ate it ♡', tags: ['t_love'], pin: true, color: '#fbe6dd', n: 2 },
  { id: 'demo-note-squirrel', title: 'sir walnuts is back', body: 'the balcony squirrel sits on the same branch every morning. we named him.', tags: ['t_random'], scrap: true, color: '#eaf0e0', n: 5 },
  { id: 'demo-note-movie', title: 'movie night, take two', body: 'we watched the same film twice in a row because neither of us watched it the first time.', tags: ['t_date'], color: '#f6e7c6', n: 9 },
  { id: 'demo-note-cafe', title: 'same café, same corner table', body: 'same terrible waiter ♡ (reminded me of our first date)', tags: ['t_crash', 't_date'], scrap: true, color: '#e6eef0', n: 16 },
  { id: 'demo-note-bike', title: 'he fixed my bike', body: 'and then explained it to me like i was five. appreciated anyway ♡', tags: ['t_gift'], color: '#fbf7ec', n: 23 },
  { id: 'demo-note-cat', title: 'sunset walk', body: 'we found a cat that walked with us for six blocks.', tags: ['t_date', 't_random'], color: '#fbe2e2', n: 30 },
  { id: 'demo-note-hidden', title: 'a secret note', body: 'type !hidden! into the search bar to find me ♡', tags: [], hidden: true, color: '#fbf7ec', n: 38 },
  { id: 'demo-note-mint', title: 'new kitchen plants', body: 'they will probably not survive us. rip in advance, mint.', tags: ['t_likes'], color: '#eaf0e0', n: 52 },
  { id: 'demo-note-thing', title: 'he said the thing ♡', body: 'the one from the note i keep in the drawer.', tags: ['t_love'], color: '#fbe6dd', n: 66 },
];
for (const t of thoughts) {
  const { id, title, body, tags = [], pin = false, scrap = false, hidden = false, color, n } = t;
  await setDoc(doc(db, 'thoughts', id), {
    title, body, tags, pin, scrap, hidden, color,
    created: daysAgo(n),
    markedDate: null,
  });
}
console.log(`✓ ${thoughts.length} thoughts`);

// ── photos (hand-drawn SVG doodles) ────────────────────────────────────────
const svg = body =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400">` +
  `<rect width="400" height="400" fill="#f5efe0"/>${body}</svg>`;

// heart — hand-written path (peach on paper)
const doodleHeart = svg(
  '<path d="M200 290 C 105 235, 105 150, 145 130 C 175 114, 200 138, 200 175 ' +
  'C 200 138, 225 114, 255 130 C 295 150, 295 235, 200 290 Z" ' +
  'fill="#df9a9a" stroke="#c48080" stroke-width="7" stroke-linejoin="round"/>'
);

// sun — butter circle with 8 rays
const ray = (x1, y1, x2, y2) =>
  `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
const doodleSun = svg(
  '<circle cx="200" cy="200" r="66" fill="#f2d98c" stroke="#d4b45c" stroke-width="7"/>' +
  `<g stroke="#d4b45c" stroke-width="9" stroke-linecap="round">` +
  ray(200, 110, 200, 68) + ray(264, 136, 292, 108) +
  ray(290, 200, 332, 200) + ray(264, 264, 292, 292) +
  ray(200, 290, 200, 332) + ray(136, 264, 108, 292) +
  ray(110, 200, 68, 200) + ray(136, 136, 108, 108) +
  '</g>'
);

// star — computed 5-point path (purple)
function starPath(cx, cy, R, r) {
  let d = '';
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? R : r;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    d += (i === 0 ? 'M' : 'L') + (cx + rad * Math.cos(a)).toFixed(1) + ' ' +
         (cy + rad * Math.sin(a)).toFixed(1) + ' ';
  }
  return d + 'Z';
}
const doodleStar = svg(
  `<path d="${starPath(200, 210, 95, 40)}" fill="#b89bd1" stroke="#9674b5" stroke-width="7" stroke-linejoin="round"/>`
);

// flower — 5 petals around a butter center (sage + pink)
const petal = (cx, cy) =>
  `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="52" fill="${petalFill()}"/>`;
let petalIdx = 0;
function petalFill() {
  return petalIdx++ % 2 === 0 ? '#7c9560' : '#e8b4b4';
}
function flowerPetalCenters() {
  const out = [];
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
    out.push([200 + 72 * Math.cos(a), 200 + 72 * Math.sin(a)]);
  }
  return out;
}
const doodleFlower = svg(
  flowerPetalCenters().map(([x, y]) => petal(x, y)).join('') +
  '<circle cx="200" cy="200" r="38" fill="#f2d98c" stroke="#c9a94e" stroke-width="6"/>'
);

// acorn — green cap + walnut body
const doodleAcorn = svg(
  '<line x1="200" y1="162" x2="200" y2="140" stroke="#856139" stroke-width="7" stroke-linecap="round"/>' +
  '<ellipse cx="200" cy="196" rx="60" ry="32" fill="#7c9560" stroke="#5f7a47" stroke-width="6"/>' +
  '<circle cx="200" cy="238" r="60" fill="#a9794f" stroke="#8a5f3c" stroke-width="6"/>'
);

const photos = [
  { id: 'demo-photo-heart',   svg: doodleHeart,  caption: 'he drew this on a napkin ♡', fav: true,  scrap: false, n: 1 },
  { id: 'demo-photo-sun',     svg: doodleSun,    caption: 'the sun finally came back',    fav: false, scrap: true,  n: 6 },
  { id: 'demo-photo-star',    svg: doodleStar,   caption: 'our lucky star',               fav: false, scrap: false, n: 13 },
  { id: 'demo-photo-flower',  svg: doodleFlower, caption: 'flowers from the market',      fav: true,  scrap: true,  n: 20 },
  { id: 'demo-photo-acorn',   svg: doodleAcorn,  caption: 'autumn finds',                 fav: false, scrap: true,  n: 34 },
];
for (const p of photos) {
  const storageRef = ref(storage, `photos/${p.id}`);
  await uploadBytes(storageRef, new Blob([p.svg], { type: 'image/svg+xml' }));
  const src = await getDownloadURL(storageRef);
  await setDoc(doc(db, 'photos', p.id), {
    src,
    caption: p.caption,
    fav: p.fav,
    scrap: p.scrap,
    hidden: false,
    created: daysAgo(p.n),
    markedDate: daysAgo(p.n),
  });
}
console.log(`✓ ${photos.length} photos`);

console.log('\nDemo seeded ♡  (settings, ' + thoughts.length + ' thoughts, ' + photos.length + ' photos)');

// ── next steps ─────────────────────────────────────────────────────────────
console.log('\nVercel env vars for the demo deploy:\n');
console.log([
  'VITE_FIREBASE_API_KEY=' + process.env.DEMO_API_KEY,
  'VITE_FIREBASE_AUTH_DOMAIN=' + process.env.DEMO_AUTH_DOMAIN,
  'VITE_FIREBASE_PROJECT_ID=' + process.env.DEMO_PROJECT_ID,
  'VITE_FIREBASE_STORAGE_BUCKET=' + process.env.DEMO_STORAGE_BUCKET,
  'VITE_FIREBASE_MESSAGING_SENDER_ID=' + (process.env.DEMO_MESSAGING_SENDER_ID || ''),
  'VITE_FIREBASE_APP_ID=' + process.env.DEMO_APP_ID,
  'VITE_DEMO_EMAIL=' + process.env.DEMO_EMAIL,
  'VITE_DEMO_PASSWORD=' + process.env.DEMO_PASSWORD,
].join('\n'));
console.log('\nSuggested demo rules (fake data — auth required keeps random drive-bys out):\n');
console.log(`Firestore:
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}

Storage:
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /photos/{id} {
      allow read, write: if request.auth != null;
    }
  }
}`);

// The Firebase SDK keeps Node's event loop alive (open connections/timers),
// so exit explicitly — every write was awaited before this point.
process.exit(0);
