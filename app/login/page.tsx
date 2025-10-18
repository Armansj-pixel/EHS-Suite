"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function ensureUserDoc(uid: string, email: string) {
    const ref = doc(db, "users", uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        uid,
        email,
        name: email.split("@")[0],
        role: "viewer", // bisa diubah admin dari Firestore
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const auth = getAuth();
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      // init dokumen user (jika belum ada)
      await ensureUserDoc(cred.user.uid, cred.user.email || email.trim());
      // ke dashboard
      router.replace("/dashboard");
    } catch (e: any) {
      console.error(e);
      setErr(
        e?.code === "auth/invalid-credential" || e?.code === "auth/wrong-password"
          ? "Email atau password salah."
          : e?.message || "Gagal login. Coba lagi."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-start justify-center p-6 bg-gray-50">
      <div className="w-full max-w-md bg-white border rounded-2xl p-6 shadow-sm">
        <h1 className="text-2xl font-semibold mb-4">Login EHS Suite</h1>

        {err && <div className="text-sm text-red-600 mb-3">⚠️ {err}</div>}

        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <input
              type="email"
              placeholder="email@contoh.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm"
              required
              autoComplete="username"
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm"
              required
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-gray-900 text-white py-2 text-sm hover:bg-gray-800 disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="mt-3 text-xs text-gray-500">
          Belum punya akun? Admin dapat menambahkan pengguna di Firebase Authentication.
        </div>

        <div className="mt-3">
          <Link href="/" className="text-sm underline text-gray-700">
            ← Kembali
          </Link>
        </div>
      </div>
    </div>
  );
}