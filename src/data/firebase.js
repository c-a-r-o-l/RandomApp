import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCPTZolzW9FT8sT30__z7ZZN29JSGzLaO8",
  authDomain: "randomapp-dd57d.firebaseapp.com",
  projectId: "randomapp-dd57d",
  storageBucket: "randomapp-dd57d.firebasestorage.app",
  messagingSenderId: "832147433566",
  appId: "1:832147433566:web:2df999cb93733c8642eccf",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);
