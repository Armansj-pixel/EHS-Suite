// lib/ptw.ts
import { db } from "@/lib/firestore";
import {
  collection, addDoc, updateDoc, doc, getDoc, getDocs,
  query, where, orderBy, Timestamp
} from "firebase/firestore";

export type PTWStatus =
  | "Draft" | "Submitted" | "Rejected" | "Approved"
  | "Active" | "Closed" | "Expired" | "Cancelled";

export type PTW = {
  title: string;
  location: string;
  description: string;
  requesterUid: string;
  startDate: Date;
  endDate: Date;
  status: PTWStatus;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  hazards?: string[];
};

export type PTWWithId = PTW & { id: string };

export async function createPTW(data: PTW) {
  const now = Timestamp.now();
  const payload: PTW = { ...data, status: data.status ?? "Submitted", createdAt: now, updatedAt: now };
  const ref = await addDoc(collection(db, "ptw"), payload);
  return ref.id;
}

export async function updatePTWStatus(id: string, status: PTWStatus) {
  await updateDoc(doc(db, "ptw", id), { status, updatedAt: Timestamp.now() });
}

export async function getPTW(id: string): Promise<PTWWithId | null> {
  const snap = await getDoc(doc(db, "ptw", id));
  return snap.exists() ? ({ id: snap.id, ...(snap.data() as PTW) }) : null;
}

export async function listPTW(uid?: string): Promise<PTWWithId[]> {
  const base = collection(db, "ptw");
  const q = uid
    ? query(base, where("requesterUid", "==", uid), orderBy("createdAt", "desc"))
    : query(base, orderBy("createdAt", "desc"));
  const snaps = await getDocs(q);
  return snaps.docs.map(d => ({ id: d.id, ...(d.data() as PTW) }));
}