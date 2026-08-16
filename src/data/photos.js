import {
  collection, doc, setDoc, deleteDoc, updateDoc,
  onSnapshot, query, orderBy, Timestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from './firebase.js';

const COL = 'photos';
const colRef = () => collection(db, COL);
const docRef = id => doc(db, COL, id);

const toJS = snap => {
  const d = snap.data();
  return {
    ...d,
    id: snap.id,
    created: d.created?.toMillis?.() ?? Date.now(),
    markedDate: d.markedDate?.toMillis?.() ?? null,
  };
};

export function subscribePhotos(callback) {
  const q = query(colRef(), orderBy('created', 'desc'));
  return onSnapshot(q, snap => callback(snap.docs.map(toJS)));
}

export async function addPhoto(id, file, meta = {}) {
  const storageRef = ref(storage, `photos/${id}`);
  await uploadBytes(storageRef, file);
  const src = await getDownloadURL(storageRef);
  await setDoc(docRef(id), {
    src,
    caption: meta.caption ?? '',
    fav: meta.fav ?? false,
    scrap: meta.scrap ?? false,
    hidden: meta.hidden ?? false,
    created: Timestamp.fromMillis(meta.created ?? Date.now()),
    markedDate: meta.markedDate ? Timestamp.fromMillis(meta.markedDate) : null,
  });
}

export async function deletePhoto(id) {
  try { await deleteObject(ref(storage, `photos/${id}`)); } catch (_) { /* already gone */ }
  await deleteDoc(docRef(id));
}

export const updatePhoto = (id, fields) => updateDoc(docRef(id), fields);
export const toggleFavorite = (id, cur) => updateDoc(docRef(id), { fav: !cur });
export const toggleScrapbook = (id, cur) => updateDoc(docRef(id), { scrap: !cur });
export const setHidden = (id, val) => updateDoc(docRef(id), { hidden: val });
export const setMarkedDate = (id, ts) =>
  updateDoc(docRef(id), { markedDate: ts ? Timestamp.fromMillis(ts) : null });

export const setCreatedDate = (id, ts) =>
  updateDoc(docRef(id), { created: Timestamp.fromMillis(ts) });
