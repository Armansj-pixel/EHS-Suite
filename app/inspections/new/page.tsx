// app/inspections/new/page.tsx
"use client";

import { useState } from "react";
import { db } from "@/lib/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function NewInspectionPage() {
  const [date, setDate] = useState<string>("");
  const [area, setArea] = useState("");
  const [finding, setFinding] = useState("");
  const [risk, setRisk] = useState("");
  const [action, setAction] = useState("");
  const [status, setStatus] = useState<"Open" | "Closed">("Open");
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      setSaving(true);
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) throw new Error("Anda belum login.");

      await addDoc(collection(db, "inspections"), {
        date: date || new Date().toISOString().slice(0, 10),
        area,
        finding,
        risk,
        action,
        status,
        createdAt: serverTimestamp(),
        createdBy: user.uid,
        createdByEmail: user.email ?? "",
      });

      router.replace("/inspections");
    } catch (err: any) {
      alert(err?.message ?? "Gagal menyimpan inspeksi");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Tambah Inspeksi</h1>

      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-4 rounded-xl border">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="text-sm">
            Tanggal
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 w-full border rounded px-2 py-1"
              required
            />
          </label>
          <label className="text-sm">
            Area Produksi
            <input
              value={area}
              onChange={(e) => setArea(e.target.value)}
              placeholder="Winding / Phase Assembly"
              className="mt-1 w-full border rounded px-2 py-1"
              required
            />
          </label>
        </div>

        <label className="text-sm block">
          Temuan
          <input
            value={finding}
            onChange={(e) => setFinding(e.target.value)}
            placeholder="Mis. Kabel crane menggantung rendah"
            className="mt-1 w-full border rounded px-2 py-1"
            required
          />
        </label>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="text-sm">
            Risiko
            <input
              value={risk}
              onChange={(e) => setRisk(e.target.value)}
              placeholder="Tersandung pekerja"
              className="mt-1 w-full border rounded px-2 py-1"
              required
            />
          </label>
          <label className="text-sm">
            Tindakan
            <input
              value={action}
              onChange={(e) => setAction(e.target.value)}
              placeholder="Dikaitkan sesuai SOP"
              className="mt-1 w-full border rounded px-2 py-1"
              required
            />
          </label>
        </div>

        <label className="text-sm block">
          Status
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            className="mt-1 w-full border rounded px-2 py-1"
          >
            <option value="Open">Open</option>
            <option value="Closed">Closed</option>
          </select>
        </label>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 rounded bg-emerald-600 text-white disabled:opacity-60"
          >
            {saving ? "Menyimpan..." : "Simpan"}
          </button>
          <button
            type="button"
            onClick={() => history.back()}
            className="px-4 py-2 rounded border"
          >
            Batal
          </button>
        </div>
      </form>
    </main>
  );
}