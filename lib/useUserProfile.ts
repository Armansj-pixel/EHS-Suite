"use client";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import type { UserProfile } from "./users";

export function useUserProfile() {
  const [ready, setReady] = useState(false);
  const [uid, setUid] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      try {
        if (!u) { setUid(null); setProfile(null); setReady(true); return; }
        setUid(u.uid);
        const ref = doc(db, "users", u.uid);
        const snap = await getDoc(ref);
        setProfile(snap.exists() ? ({ uid: u.uid, ...(snap.data() as UserProfile) }) : null);
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