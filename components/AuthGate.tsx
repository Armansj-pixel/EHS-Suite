"use client";
import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function AuthGate({
  children,
  redirectTo = "/(auth)/login",
}: {
  children: React.ReactNode;
  redirectTo?: string;
}) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setReady(true);
    });
    return () => unsub();
  }, []);

  // Selama inisialisasi, JANGAN redirect—tampilkan loader saja
  if (!ready) {
    return (
      <div className="min-h-dvh flex items-center justify-center text-neutral-500">
        Memuat sesi...
      </div>
    );
  }

  // Setelah siap dan user memang null → baru redirect
  if (!user) {
    if (typeof window !== "undefined") {
      window.location.href = redirectTo;
    }
    return null;
  }

  return <>{children}</>;
}