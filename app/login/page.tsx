"use client";
import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState(""), [pass, setPass] = useState("");
  const [err, setErr] = useState<string|null>(null); const [loading, setLoading]=useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault(); setErr(null); setLoading(true);
    try { await signInWithEmailAndPassword(auth, email, pass); window.location.href="/dashboard"; }
    catch (e:any) { setErr(e?.message ?? "Login gagal"); }
    finally { setLoading(false); }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-4 rounded-2xl border bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold">Login EHS Suite</h1>
        <form onSubmit={onSubmit} className="space-y-3">
          <input className="input w-full" type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} required />
          <input className="input w-full" type="password" placeholder="Password" value={pass} onChange={e=>setPass(e.target.value)} required />
          {err && <p className="text-sm text-red-600">{err}</p>}
          <button className="btn w-full" disabled={loading}>{loading?"Signing in...":"Login"}</button>
        </form>
        <p className="text-xs"><Link className="underline" href="/">← Kembali</Link></p>
      </div>
    </main>
  );
}