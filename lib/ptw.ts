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

export type PTWStatus =
  | "Draft"
  | "Submitted"
  | "Rejected"
  | "Approved"
  | "Active"
  | "Closed"
  | "Expired"
  | "Cancelled";

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

/** Buat PTW baru */
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

/** Ambil  PTW milik user login (default). Jika owner ingin lihat semua, set `all=true` dan siapkan rules. */
export async function listPTW(options?: { all?: boolean }): Promise<PTW[]> {
  const user = auth.currentUser;
  if (!user) throw new Error("Unauthenticated");

  const col = collection(db, "ptw");
  const q = options?.all
    ? query(col, orderBy("createdAt", "desc"))
    : query(col, where("requesterUid", "==", user.uid), orderBy("createdAt", "desc"));

  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data() as Omit<PTW, "id">;
    return {
      id: d.id,
      title: (data as any).title ?? "",
      location: (data as any).location ?? "",
      description: (data as any).description ?? "",
      status: (data as any).status ?? ("Submitted" as PTWStatus),
      requesterUid: (data as any).requesterUid ?? "",
      requesterName: (data as any).requesterName ?? null,
      createdAt: (data as any).createdAt ?? null,
      updatedAt: (data as any).updatedAt ?? null,
    };
  });
}

/** Ambil detail satu PTW */
export async function getPTW(id: string): Promise<PTW | null> {
  const ref = doc(db, "ptw", id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const data = snap.data() as Omit<PTW, "id">;
  return { id: snap.id, ...data } as PTW;
}

/** Ubah status PTW (butuh izin di Rules) */
export async function updatePTWStatus(id: string, status: PTWStatus): Promise<void> {
  const ref = doc(db, "ptw", id);
  await updateDoc(ref, {
    status,
    updatedAt: serverTimestamp(),
  });
// --- kompatibilitas untuk halaman lama ---
export type PTWWithId = PTW;
}