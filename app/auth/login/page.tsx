"use client";

import { useState } from "react";
import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      // login menggunakan firebase auth
      await signInWithEmailAndPassword(auth, email.trim(), password);
      window.location.href = "/"; // redirect ke dashboard
    } catch (err: any) {
      setError(err?.message ?? "Login gagal");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center p-6 bg-neutral-50">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm space-y-4 bg-white p-6 rounded-2xl shadow"
      >
        <h1 className="text-xl font-semibold text-center">Login – EHS Suite</h1>

        <div className="space-y-1">
          <label className="text-sm text-neutral-600">Email</label>
          <input
            type="email"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm text-neutral-600">Password</label>
          <input
            type="password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          disabled={loading}
          className="btn w-full"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>

        <p className="text-xs text-neutral-500 text-center">
          Belum punya akun?{" "}
          <Link href="#" className="underline">
            Hubungi admin
          </Link>
        </p>
      </form>
    </div>
  );
}