import {
  collection, doc, setDoc, deleteDoc, updateDoc,
  onSnapshot, query, orderBy, writeBatch, Timestamp,
} from 'firebase/firestore';
import { db } from './firebase.js';

const COL = 'thoughts';
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

export function subscribeThoughts(callback) {
  const q = query(colRef(), orderBy('created', 'desc'));
  return onSnapshot(q, snap => callback(snap.docs.map(toJS)));
}

export const DEFAULT_HIDDEN_TOKEN = '!hidden!';
const escapeRegex = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function stripHiddenToken(title = '', body = '', token = DEFAULT_HIDDEN_TOKEN) {
  const re = new RegExp(escapeRegex(token), 'gi');
  const hadToken = re.test(title) || re.test(body);
  re.lastIndex = 0;
  return {
    title: title.replace(re, '').trim(),
    body: body.replace(re, '').replace(/[ \t]+\n/g, '\n').trim(),
    tokenFound: hadToken,
  };
}

export async function saveThought(note, hiddenToken = DEFAULT_HIDDEN_TOKEN) {
  const { id, title = '', body = '', created, markedDate, hidden: prevHidden = false, ...rest } = note;
  const { title: cleanTitle, body: cleanBody, tokenFound } = stripHiddenToken(title, body, hiddenToken);
  await setDoc(docRef(id), {
    ...rest,
    title: cleanTitle,
    body: cleanBody,
    hidden: tokenFound || !!prevHidden,
    created: Timestamp.fromMillis(typeof created === 'number' ? created : Date.now()),
    markedDate: markedDate ? Timestamp.fromMillis(markedDate) : null,
  });
}

export const deleteThought = id => deleteDoc(docRef(id));

export const togglePin = (id, cur) => updateDoc(docRef(id), { pin: !cur });
export const toggleScrapbook = (id, cur) => updateDoc(docRef(id), { scrap: !cur });
export const setHidden = (id, val) => updateDoc(docRef(id), { hidden: val });
export const setMarkedDate = (id, ts) =>
  updateDoc(docRef(id), { markedDate: ts ? Timestamp.fromMillis(ts) : null });

export async function removeTagFromThoughts(tagId, thoughts) {
  const affected = thoughts.filter(t => (t.tags || []).includes(tagId));
  if (!affected.length) return;
  const batch = writeBatch(db);
  affected.forEach(t =>
    batch.update(docRef(t.id), { tags: t.tags.filter(x => x !== tagId) })
  );
  await batch.commit();
}
