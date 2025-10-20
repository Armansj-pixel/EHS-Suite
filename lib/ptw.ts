// lib/ptw.ts
import { db } from "@/lib/firestore";
import {
  collection, doc, addDoc, getDoc, getDocs, updateDoc,
  query, where, orderBy, Timestamp, serverTimestamp
} from "firebase/firestore";

export type PTWStatus = "Draft" | "Submitted" | "Rejected" | "Approved" | "Active" | "Closed" | "Expired" | "Cancelled";

export interface PTW {
  id?: string;
  code: string;
  type: string;            // "Hot Work" | "Electrical" | "Confined Space" | ...
  area: string;
  locationDetail?: string;
  jobDescription: string;
  requesterUid: string;
  requesterName: string;
  supervisorUid?: string;
  ehsApproverUid?: string;
  finalApproverUid?: string;  // opsional
  startPlanned: Timestamp;
  endPlanned: Timestamp;
  startActual?: Timestamp | null;
  endActual?: Timestamp | null;
  status: PTWStatus;
  controls?: {
    apd?: string[];
    isolation?: string[];
    gasTest?: { required: boolean; result?: string | null; by?: string | null; time?: Timestamp | null };
    fireWatch?: boolean;
  };
  approvals?: Array<{ role: string; uid: string; name: string; at?: Timestamp | null; decision?: "approved" | "rejected" | null; note?: string | null }>;
  extension?: { count: number; history: Array<{ at: Timestamp; by: string; hours: number; note?: string }> };
  reasonReject?: string | null;
  reasonCancel?: string | null;
  hirarcRef?: string | null;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  auditTrail?: Array<{ at: Timestamp; by: string; action: string; note?: string }>;
}

const col = collection(db, "ptw");

// Generator nomor sederhana
export async function generatePTWCode(): Promise<string> {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const stamp = String(now.getTime()).slice(-5);
  return `PTW-${y}${m}${d}-${stamp}`;
}

export async function createPTW(data: Omit<PTW, "id"|"code"|"createdAt"|"updatedAt"|"status">) {
  const code = await generatePTWCode();
  const docRef = await addDoc(col, {
    ...data,
    code,
    status: "Submitted",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    auditTrail: [{ at: serverTimestamp(), by: data.requesterUid, action: "SUBMIT" }]
  } as any);
  return docRef.id;
}

export async function getPTW(id: string): Promise<PTW | null> {
  const ref = doc(db, "ptw", id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as PTW) };
}

export async function listPTW(status?: PTWStatus): Promise<PTW[]> {
  const q = status
    ? query(col, where("status", "==", status), orderBy("startPlanned", "desc"))
    : query(col, orderBy("createdAt", "desc"));
  const res = await getDocs(q);
  return res.docs.map(d => ({ id: d.id, ...(d.data() as PTW) }));
}

export async function updatePTWStatus(id: string, next: PTWStatus, byUid: string, note?: string) {
  const ref = doc(db, "ptw", id);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("PTW not found");
  const trail = (snap.data().auditTrail ?? []) as PTW["auditTrail"];
  await updateDoc(ref, {
    status: next,
    updatedAt: serverTimestamp(),
    auditTrail: [...(trail ?? []), { at: serverTimestamp(), by: byUid, action: `STATUS:${next}`, note: note ?? null }]
  } as any);
}

export async function activatePTW(id: string, byUid: string) {
  const ref = doc(db, "ptw", id);
  // Ambil trail lama bila ada
  const snap = await getDoc(ref);
  const trail = (snap.exists() ? (snap.data().auditTrail ?? []) : []) as PTW["auditTrail"];
  await updateDoc(ref, {
    status: "Active",
    startActual: serverTimestamp(),
    updatedAt: serverTimestamp(),
    auditTrail: [...(trail ?? []), { at: serverTimestamp(), by: byUid, action: "ACTIVATE" }]
  } as any);
}

export async function closePTW(id: string, byUid: string, note?: string) {
  const ref = doc(db, "ptw", id);
  // Ambil trail lama bila ada
  const snap = await getDoc(ref);
  const trail = (snap.exists() ? (snap.data().auditTrail ?? []) : []) as PTW["auditTrail"];
  await updateDoc(ref, {
    status: "Closed",
    endActual: serverTimestamp(),
    updatedAt: serverTimestamp(),
    auditTrail: [...(trail ?? []), { at: serverTimestamp(), by: byUid, action: "CLOSE", note: note ?? null }]
  } as any);
}