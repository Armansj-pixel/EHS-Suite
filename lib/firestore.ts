// lib/firestore.ts
// Reusable Firestore CRUD helpers (typed) + pagination + batch utils

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  limit,
  query,
  serverTimestamp,
  setDoc,
  startAfter,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
  increment,
  type DocumentData,
  type QueryConstraint,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

// ————— Generic helpers ————— //
export type DocWithId<T = DocumentData> = T & { id: string };

export const colRef = (path: string) => collection(db, path);
export const docRef = (path: string, id: string) => doc(db, path, id);

export async function createDoc<T extends DocumentData>(path: string, data: T) {
  const ref = await addDoc(colRef(path), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function setDocMerge<T extends DocumentData>(
  path: string,
  id: string,
  data: Partial<T>
) {
  await setDoc(
    docRef(path, id),
    {
      ...data,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function updateDocById<T extends DocumentData>(
  path: string,
  id: string,
  data: Partial<T>
) {
  await updateDoc(docRef(path, id), { ...data, updatedAt: serverTimestamp() });
}

export async function deleteDocById(path: string, id: string) {
  await deleteDoc(docRef(path, id));
}

export async function getById<T extends DocumentData>(
  path: string,
  id: string
): Promise<DocWithId<T> | null> {
  const snap = await getDoc(docRef(path, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as T) };
}

export async function listDocs<T extends DocumentData>(
  path: string,
  constraints: QueryConstraint[] = []
): Promise<DocWithId<T>[]> {
  const q = query(colRef(path), ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as T) }));
}

// ————— Pagination ————— //
export type PageResult<T> = { items: DocWithId<T>[]; nextCursor: Timestamp | null };

export async function listPaginated<T extends DocumentData>(
  path: string,
  opts: { pageSize?: number; cursor?: Timestamp | null; extra?: QueryConstraint[] } = {}
): Promise<PageResult<T>> {
  const { pageSize = 20, cursor = null, extra = [] } = opts;
  const base: QueryConstraint[] = [orderBy("createdAt", "desc"), limit(pageSize)];
  const q = cursor
    ? query(colRef(path), ...extra, ...base, startAfter(cursor))
    : query(colRef(path), ...extra, ...base);
  const snap = await getDocs(q);
  const items = snap.docs.map((d) => ({ id: d.id, ...(d.data() as T) }));
  const nextCursor = snap.docs.length
    ? (snap.docs[snap.docs.length - 1].get("createdAt") as Timestamp | null)
    : null;
  return { items, nextCursor };
}

// ————— Counter helper (e.g., daily order number) ————— //
export async function incrementCounter(
  path: string,
  id: string,
  field = "value",
  step = 1
) {
  await setDoc(docRef(path, id), { [field]: increment(step) }, { merge: true });
}

// ————— Batch utils ————— //
export async function batchUpdate(
  path: string,
  updates: { id: string; data: DocumentData }[]
) {
  const batch = writeBatch(db);
  for (const u of updates) {
    batch.update(docRef(path, u.id), { ...u.data, updatedAt: serverTimestamp() });
  }
  await batch.commit();
}

export async function batchDelete(path: string, ids: string[]) {
  const batch = writeBatch(db);
  for (const id of ids) batch.delete(docRef(path, id));
  await batch.commit();
}

// ————— Example typed usage ————— //
export type HIRARC = {
  area: string;
  jobTask: string;
  hazards: string[];
  controls: string[];
  riskBefore: "Low" | "Medium" | "High";
  riskAfter: "Low" | "Medium" | "High";
  owner: string; // uid
  status: "Open" | "In Progress" | "Closed";
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};

// Create HIRARC
export const createHIRARC = (data: Omit<HIRARC, "createdAt" | "updatedAt">) =>
  createDoc<HIRARC>("hirarc", data as HIRARC);

// List HIRARC (Open only)  ✅ FIXED
export const listOpenHIRARC = () =>
  listDocs<HIRARC>("hirarc", [
    where("status", "==", "Open"),
    orderBy("createdAt", "desc"),
    limit(50),
  ]);

// Update status HIRARC
export const closeHIRARC = (id: string) =>
  updateDocById<HIRARC>("hirarc", id, { status: "Closed" });