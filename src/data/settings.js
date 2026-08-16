import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from './firebase.js';

// single shared settings doc: startISO, metISO, tags, countdowns
const ref = () => doc(db, 'settings', 'app');

export function subscribeSettings(callback) {
  return onSnapshot(ref(), snap => callback(snap.exists() ? snap.data() : null));
}

export const saveSetting = (key, value) => setDoc(ref(), { [key]: value }, { merge: true });
