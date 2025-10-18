"use client";

import { onAuthStateChanged, getAuth } from "firebase/auth";
import { useEffect, useState } from "react";
import LogoutButton from "./LogoutButton";

export default function TopBar() {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const auth = getAuth();
    const unsub = onAuthStateChanged(auth, (u) => setEmail(u?.email ?? null));
    return () => unsub();
  }, []);

  return (
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-2xl font-semibold text-gray-800">Dashboard KPI</h1>
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-600">{email ?? "—"}</span>
        <LogoutButton />
      </div>
    </div>
  );
}