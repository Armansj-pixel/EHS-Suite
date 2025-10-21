// lib/ptw.ts
import { auth, db } from "@/lib/firestore";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  Timestamp,
} from "firebase/firestore";

/**
 * Status yang digunakan dalam Permit to Work.
 */
export type PTWStatus =
  | "Draft"
  | "Submitted"
  | "Rejected"
  | "Approved"
  | "Active"
  | "Closed"
  | "Expired"
  | "Cancelled";

/**
 * Struktur utama data Permit to Work.
 */
export interface PTW {
  id: string;
  title: string;
  location: string;
  description: string;
  status: PTWStatus;
  requesterUid: string;
  requesterName?: string | null;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

/**
 * Alias kompatibilitas untuk versi lama (mis. PTWWithId)
 */
export type PTWWithId = PTW;

/**
 * Buat dokumen PTW baru di Firestore.
 */
export async function createPTW(input: {
  title: string;
  location: string;
  description: string;
}): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error("Unauthenticated");

  const ref = await addDoc(collection(db, "ptw"), {
    title: input.title.trim(),
    location: input.location.trim(),
    description: input.description.trim(),
    status: "Submitted" as PTWStatus,
    requesterUid: user.uid,
    requesterName: user.displayName ?? user.email ?? null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return ref.id;
}

/**
 * Ambil daftar PTW milik user login (default)
 * atau semua (jika all=true dan user berperan owner/EHS).
 */
// lib/ptw.ts (hanya fungsi listPTW diubah)
export async function listPTW(options?: { all?: boolean }): Promise<PTW[]> {
  const user = auth.currentUser;
  if (!user) throw new Error("Unauthenticated");

  const col = collection(db, "ptw");

  // Hindari orderBy agar tidak butuh index komposit
  const q = options?.all
    ? query(col) // (opsional: untuk admin/EHS)
    : query(col, where("requesterUid", "==", user.uid));

  const snap = await getDocs(q);

  const rows = snap.docs.map((d) => {
    const data = d.data() as any;
    return {
      id: d.id,
      title: data.title ?? "",
      location: data.location ?? "",
      description: data.description ?? "",
      status: (data.status as PTWStatus) ?? "Submitted",
      requesterUid: data.requesterUid ?? "",
      requesterName: data.requesterName ?? null,
      createdAt: data.createdAt ?? null,
      updatedAt: data.updatedAt ?? null,
    } as PTW;
  });

  // Urutkan di client berdasarkan createdAt desc
  rows.sort((a, b) => {
    const ta = a.createdAt?.seconds ?? 0;
    const tb = b.createdAt?.seconds ?? 0;
    return tb - ta;
  });

  return rows;
}

/**
 * Ambil detail satu PTW berdasarkan ID.
 */
export async function getPTW(id: string): Promise<PTW | null> {
  const ref = doc(db, "ptw", id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const data = snap.data() as any;
  return {
    id: snap.id,
    title: data.title ?? "",
    location: data.location ?? "",
    description: data.description ?? "",
    status: (data.status as PTWStatus) ?? "Submitted",
    requesterUid: data.requesterUid ?? "",
    requesterName: data.requesterName ?? null,
    createdAt: data.createdAt ?? null,
    updatedAt: data.updatedAt ?? null,
  };
}

/**
 * Update status PTW (untuk Owner/EHS)
 */
export async function updatePTWStatus(id: string, status: PTWStatus): Promise<void> {
  const ref = doc(db, "ptw", id);
  await updateDoc(ref, {
    status,
    updatedAt: serverTimestamp(),
  });
}