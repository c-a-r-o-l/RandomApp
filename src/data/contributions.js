import {
  collection, addDoc, getDocs, onSnapshot, query, orderBy, Timestamp,
} from 'firebase/firestore';
import { db } from './firebase.js';

const COL = 'contributions';
const colRef = () => collection(db, COL);

const toJS = snap => {
  const d = snap.data();
  return {
    id: snap.id,
    date: d.date,
    type: d.type,
    createdAt: d.createdAt?.toMillis?.() ?? Date.now(),
  };
};

export async function logContribution(type) {
  const date = new Date().toISOString().slice(0, 10);
  await addDoc(colRef(), { date, type, createdAt: Timestamp.now() });
}

export function subscribeContributions(callback) {
  const q = query(colRef(), orderBy('createdAt', 'asc'));
  return onSnapshot(q, snap => callback(snap.docs.map(toJS)));
}

export async function getAllContributions() {
  const q = query(colRef(), orderBy('createdAt', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map(toJS);
}
