import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

// Env-driven so a second deploy can point at the demo Firebase project
// (see CLAUDE.md → "Demo deploy"). Falls back to the real project.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? "AIzaSyCPTZolzW9FT8sT30__z7ZZN29JSGzLaO8",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? "randomapp-dd57d.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? "randomapp-dd57d",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? "randomapp-dd57d.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? "832147433566",
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? "1:832147433566:web:2df999cb93733c8642eccf",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);
