// app/hazards/new/page.tsx
"use client";

import { useState } from "react";
import { db } from "@/lib/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { useRouter } from "next/navigation";

type HazardType = "Hazard" | "Near Miss";
type RiskLevel = "Low" | "Medium" | "High";
type Status = "Open" | "In Progress" | "Closed";

export default function NewHazardPage() {
  const [date, setDate] = useState<string>("");
  const [area, setArea] = useState("");
  const [type, setType] = useState<HazardType>("Hazard");
  const [description, setDescription] = useState("");
  const [riskLevel, setRiskLevel] = useState<RiskLevel>("Medium");
  const [action, setAction] = useState("");
  const [status, setStatus] = useState<Status>("Open");
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      setSaving(true);
      const user = getAuth().currentUser;
      if (!user) throw new Error("Anda belum login.");

      await addDoc(collection(db, "hazard_reports"), {
        date: date || new Date().toISOString().slice(0, 10),
        area,
        type,                 // "Hazard" | "Near Miss"
        description,
        riskLevel,            // "Low" | "Medium" | "High"
        action,
        status,               // "Open" | "In Progress" | "Closed"
        createdAt: serverTimestamp(),
        createdBy: user.uid,
        createdByEmail: user.email ?? "",
      });

      router.replace("/hazards");
    } catch (err: any) {
      alert(err?.message ?? "Gagal menyimpan laporan");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Tambah Hazard / Near Miss</h1>

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
            Area
            <input
              value={area}
              onChange={(e) => setArea(e.target.value)}
              placeholder="Winding / Phase Assembly / dst"
              className="mt-1 w-full border rounded px-2 py-1"
              required
            />
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="text-sm">
            Jenis
            <select
              value={type}
              onChange={(e) => setType(e.target.value as HazardType)}
              className="mt-1 w-full border rounded px-2 py-1"
            >
              <option>Hazard</option>
              <option>Near Miss</option>
            </select>
          </label>

          <label className="text-sm">
            Level Risiko
            <select
              value={riskLevel}
              onChange={(e) => setRiskLevel(e.target.value as RiskLevel)}
              className="mt-1 w-full border rounded px-2 py-1"
            >
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
            </select>
          </label>
        </div>

        <label className="text-sm block">
          Deskripsi
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Jelaskan kondisi tidak aman / kejadian nyaris celaka"
            className="mt-1 w-full border rounded px-2 py-2 min-h-[88px]"
            required
          />
        </label>

        <label className="text-sm block">
          Tindakan / Rencana
          <input
            value={action}
            onChange={(e) => setAction(e.target.value)}
            placeholder="Mis. Bersihkan tumpahan oli dan pasang signage"
            className="mt-1 w-full border rounded px-2 py-1"
            required
          />
        </label>

        <label className="text-sm block">
          Status
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as Status)}
            className="mt-1 w-full border rounded px-2 py-1"
          >
            <option>Open</option>
            <option>In Progress</option>
            <option>Closed</option>
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
          <button type="button" onClick={() => history.back()} className="px-4 py-2 rounded border">
            Batal
          </button>
        </div>
      </form>
    </main>
  );
}