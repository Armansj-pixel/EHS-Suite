"use client";
import { useState } from "react";
import Link from "next/link";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { ensureUserProfile } from "@/lib/users";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [pass, setPass]   = useState("");
  const [err, setErr]     = useState<string | null>(null);
  const [info, setInfo]   = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setInfo(null);
    setLoading(true);
    try {
      // 1) Login ke Firebase
      await signInWithEmailAndPassword(auth, email, pass);

      // 2) Auto-provision profile di Firestore jika belum ada
      const profile = await ensureUserProfile({
        role: "ehs_manager", // default untuk kamu (bisa disesuaikan)
        dept: "Production",
      });

      // 3) Notifikasi sukses
      if (profile) {
        setInfo(
          `Profil ${profile.name || profile.email || profile.uid} siap. Role: ${profile.role}. Mengarahkan ke dashboard...`
        );
      } else {
        setInfo("Profil siap. Mengarahkan ke dashboard...");
      }

      // 4) Redirect ke dashboard
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 900);
    } catch (e: any) {
      setErr(e?.message ?? "Login gagal");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-4 rounded-2xl border bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold">Login EHS Suite</h1>

        <form onSubmit={onSubmit} className="space-y-3">
          <input
            className="input w-full"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e)=>setEmail(e.target.value)}
            required
          />
          <input
            className="input w-full"
            type="password"
            placeholder="Password"
            value={pass}
            onChange={(e)=>setPass(e.target.value)}
            required
          />

        {err && <p className="text-sm text-red-600">{err}</p>}
        {info && (
          <div className="text-sm rounded-md border border-green-200 bg-green-50 p-2 text-green-700">
            {info}
          </div>
        )}

          <button className="btn w-full" disabled={loading}>
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>

        <p className="text-xs text-neutral-500">
          Belum punya akun? Admin bisa menambahkan akun di Firebase Authentication.
        </p>
        <p className="text-xs">
          <Link className="underline" href="/">← Kembali</Link>
        </p>
      </div>
    </main>
  );
}