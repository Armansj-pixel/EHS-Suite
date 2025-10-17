"use client";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export type Role = "owner" | "ehs_manager" | "supervisor" | "staff" | "contractor";
export type UserProfile = {
  uid: string;
  name?: string;
  email?: string;
  role: Role;
  dept?: string;
  active?: boolean;
};

export function useUserProfile() {
  const [ready, setReady] = useState(false);
  const [uid, setUid] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      try {
        if (!u) {
          setUid(null);
          setProfile(null);
          setReady(true);
          return;
        }
        setUid(u.uid);

        const ref = doc(db, "users", u.uid);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
          // fallback minimal dari Auth kalau dokumen belum ada
          setProfile({ uid: u.uid, email: u.email ?? "", role: "staff" });
        } else {
          const raw = snap.data() as Partial<UserProfile>;
          const { uid: _discard, ...rest } = raw;
          setProfile({
            uid: u.uid, // kebenaran UID dari Auth
            email: u.email ?? rest.email,
            role: (rest.role as Role) ?? "staff",
            name: rest.name,
            dept: rest.dept,
            active: rest.active,
          });
        }
      } catch (e: any) {
        setError(e?.message ?? "Failed to load profile");
      } finally {
        setReady(true);
      }
    });
    return () => unsub();
  }, []);

  return { ready, uid, profile, error };
}