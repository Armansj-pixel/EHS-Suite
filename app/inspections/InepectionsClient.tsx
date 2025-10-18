// app/inspections/InspectionsClient.tsx
"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
} from "firebase/firestore";
import Link from "next/link";

type Row = {
  id: string;
  date?: string;
  area?: string;
  finding?: string;
  status?: string;
  createdByEmail?: string;
};

export default function InspectionsClient() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const ref = collection(db, "inspections");
      const q = query(ref, orderBy("createdAt", "desc"), limit(50));
      const snap = await getDocs(q);
      const list: Row[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      setRows(list);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="bg-white rounded-xl border">
      <div className="p-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Daftar Inspeksi</h2>
        <div className="flex gap-2">
          <button onClick={load} className="px-3 py-1 border rounded text-sm">Refresh</button>
          <Link href="/inspections/new" className="px-3 py-1 rounded bg-emerald-600 text-white text-sm">
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
              <th className="text-left p-2">Temuan</th>
              <th className="text-left p-2">Status</th>
              <th className="text-left p-2">Reporter</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="p-3 text-gray-500" colSpan={5}>Memuat…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td className="p-3 text-gray-500" colSpan={5}>Belum ada data</td></tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="p-2">{r.date ?? "-"}</td>
                  <td className="p-2">{r.area ?? "-"}</td>
                  <td className="p-2">{r.finding ?? "-"}</td>
                  <td className="p-2">
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      r.status === "Closed" ? "bg-emerald-100 text-emerald-700" : "bg-yellow-100 text-yellow-700"
                    }`}>{r.status ?? "-"}</span>
                  </td>
                  <td className="p-2">{r.createdByEmail ?? "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}