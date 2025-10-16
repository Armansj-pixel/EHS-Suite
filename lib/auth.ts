// 7) lib/auth.ts
// -----------------
// Authentication & Role helper utilities for EHS Suite
// Handles user roles (owner, ehs_manager, supervisor, staff, contractor)
// and provides guards for protected routes.

import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export type Role = "owner" | "ehs_manager" | "supervisor" | "staff" | "contractor";
export type UserProfile = {
  uid: string;
  name?: string;
  email?: string;
  role: Role;
  dept?: string;
  active?: boolean;
};

/**
 * getCurrentUserProfile()
 * Fetch user data + role info from Firestore users/{uid}
 */
export async function getCurrentUserProfile(): Promise<UserProfile | null> {
  return new Promise((resolve) => {
    onAuthStateChanged(auth, async (user: User | null) => {
      if (!user) return resolve(null);
      const ref = doc(db, "users", user.uid);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        // Jika user belum ada di Firestore, anggap role default = staff
        resolve({ uid: user.uid, email: user.email || "", role: "staff" });
      } else {
        resolve({ uid: user.uid, ...(snap.data() as UserProfile) });
      }
    });
  });
}

/** Role-based guard */
export function hasRole(user: UserProfile | null, allowed: Role[]): boolean {
  if (!user) return false;
  return allowed.includes(user.role);
}

/** Simple route protection for client pages */
export function redirectIfUnauthorized(user: UserProfile | null, allowed: Role[]) {
  if (!user) {
    window.location.href = "/(auth)/login";
    return;
  }
  if (!allowed.includes(user.role)) {
    alert("Akses ditolak: Anda tidak memiliki izin untuk halaman ini.");
    window.location.href = "/";
  }
}

/**
 * 📘 Contoh penggunaan di halaman client:
 * 
 * import { useEffect, useState } from "react";
 * import { getCurrentUserProfile, redirectIfUnauthorized } from "@/lib/auth";
 * 
 * const [user, setUser] = useState<UserProfile|null>(null);
 * useEffect(() => {
 *   getCurrentUserProfile().then(u => {
 *     setUser(u);
 *     redirectIfUnauthorized(u, ["owner", "ehs_manager"]);
 *   });
 * }, []);
 */