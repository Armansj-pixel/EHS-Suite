// app/hazards/HazardsClient.tsx
"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, limit, orderBy, query } from "firebase/firestore";
import Link from "next/link";

type Row = {
  id: string;
  date?: string;
  area?: string;
  type?: "Hazard" | "Near Miss";
  description?: string;
  riskLevel?: "Low" | "Medium" | "High";
  status?: "Open" | "In Progress" | "Closed";
  createdByEmail?: string;
};

export default function HazardsClient() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const ref = collection(db, "hazard_reports");
      const q = query(ref, orderBy("createdAt", "desc"), limit(50));
      const snap = await getDocs(q);
      const list: Row[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      setRows(list);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const badge = (s?: string) =>
    `px-2 py-0.5 rounded text-xs ${
      s === "Closed"
        ? "bg-emerald-100 text-emerald-700"
        : s === "In Progress"
        ? "bg-yellow-100 text-yellow-700"
        : "bg-red-100 text-red-700"
    }`;

  const risk = (r?: string) =>
    `px-2 py-0.5 rounded text-xs ${
      r === "High" ? "bg-red-100 text-red-700" : r === "Medium" ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-700"
    }`;

  return (
    <div className="bg-white rounded-xl border">
      <div className="p-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Daftar Hazard & Near Miss</h2>
        <div className="flex gap-2">
          <button onClick={load} className="px-3 py-1 border rounded text-sm">Refresh</button>
          <Link href="/hazards/new" className="px-3 py-1 rounded bg-emerald-600 text-white text-sm">
            + Tambah
          </Link>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="text-left p-2">Tanggal</th>
              <th className="text-left p-2">Area</th>
              <th className="text-left p-2">Jenis</th>
              <th className="text-left p-2">Risk</th>
              <th className="text-left p-2">Deskripsi</th>
              <th className="text-left p-2">Status</th>
              <th className="text-left p-2">Pelapor</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="p-3 text-gray-500" colSpan={7}>Memuat…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td className="p-3 text-gray-500" colSpan={7}>Belum ada data</td></tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-t align-top">
                  <td className="p-2 whitespace-nowrap">{r.date ?? "-"}</td>
                  <td className="p-2 whitespace-nowrap">{r.area ?? "-"}</td>
                  <td className="p-2"><span className="px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-700">{r.type ?? "-"}</span></td>
                  <td className="p-2"><span className={risk(r.riskLevel)}>{r.riskLevel ?? "-"}</span></td>
                  <td className="p-2 max-w-[320px]">{r.description ?? "-"}</td>
                  <td className="p-2"><span className={badge(r.status)}>{r.status ?? "-"}</span></td>
                  <td className="p-2 whitespace-nowrap">{r.createdByEmail ?? "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}