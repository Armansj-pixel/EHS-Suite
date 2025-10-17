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
          role: (defaults?.role as Role) ?? "ehs_manager", // default aman buat kamu
          dept: defaults?.dept ?? "Production",
          active: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        await setDoc(ref, profile);
        resolve(profile);
      } else {
        const merged = { uid: u.uid, ...(snap.data() as UserProfile) };
        resolve(merged);
      }
    });
  });
}