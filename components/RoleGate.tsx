"use client";
import { useEffect } from "react";
import { useUserProfile } from "@/lib/useUserProfile";

export default function RoleGate({
  allow,
  children,
  fallback = null,
}: {
  allow: Array<"owner" | "ehs_manager" | "supervisor" | "staff" | "contractor">;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { ready, profile } = useUserProfile();

  useEffect(() => {
    // bisa tambahkan log/telemetry di sini kalau butuh
  }, [ready, profile]);

  if (!ready) return <div className="p-6 text-neutral-500">Memuat sesi...</div>;
  if (!profile || !allow.includes(profile.role)) return <>{fallback ?? <div className="p-6">Akses ditolak.</div>}</>;
  return <>{children}</>;
}