import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

export type Role = "owner" | "ehs_manager" | "supervisor" | "staff" | "contractor";
export type UserProfile = {
  uid: string;
  name?: string;
  email?: string;
  role: Role;
  dept?: string;
  active?: boolean;
  createdAt?: any;
  updatedAt?: any;
};

/** Pastikan users/{uid} ada; jika belum, buat default profile */
export async function ensureUserProfile(defaults?: Partial<UserProfile>) {
  return new Promise<UserProfile | null>((resolve) => {
    onAuthStateChanged(auth, async (u) => {
      if (!u) return resolve(null);

      const ref = doc(db, "users", u.uid);
      const snap = await getDoc(ref);

      if (!snap.exists()) {
        const profile: UserProfile = {
          uid: u.uid,
          email: u.email ?? "",
          name: u.displayName ?? "",
          role: (defaults?.role as Role) ?? "ehs_manager",
          dept: defaults?.dept ?? "Production",
          active: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        await setDoc(ref, profile);
        return resolve(profile);
      } else {
        // ⚠️ Hapus uid dari data Firestore sebelum merge untuk hindari duplikasi
        const raw = snap.data() as Partial<UserProfile>;
        const { uid: _discard, ...rest } = raw;

        const merged: UserProfile = {
          uid: u.uid, // sumber kebenaran UID = dari Auth
          email: u.email ?? rest.email,
          name: rest.name,
          role: (rest.role as Role) ?? "staff",
          dept: rest.dept,
          active: rest.active ?? true,
          createdAt: rest.createdAt,
          updatedAt: rest.updatedAt,
        };
        return resolve(merged);
      }
    });
  });
}