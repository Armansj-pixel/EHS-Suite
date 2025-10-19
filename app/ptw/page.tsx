"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AuthGate from "@/components/AuthGate";
import { listPTW, PTW } from "@/lib/ptw";

export default function PTWPage() {
  const [items, setItems] = useState<PTW[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const rows = await listPTW();
        setItems(rows);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <AuthGate>
      <div className="max-w-5xl mx-auto p-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold">Permit to Work (PTW)</h1>
          <Link href="/ptw/new" className="px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700">Buat PTW</Link>
        </div>

        {loading ? (
          <div className="text-gray-500">Memuat...</div>
        ) : items.length === 0 ? (
          <div className="text-gray-500">Belum ada data PTW.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 border">Code</th>
                  <th className="p-2 border">Tipe</th>
                  <th className="p-2 border">Area</th>
                  <th className="p-2 border">Waktu</th>
                  <th className="p-2 border">Status</th>
                  <th className="p-2 border"></th>
                </tr>
              </thead>
              <tbody>
                {items.map(row => (
                  <tr key={row.id}>
                    <td className="p-2 border">{row.code}</td>
                    <td className="p-2 border">{row.type}</td>
                    <td className="p-2 border">{row.area}</td>
                    <td className="p-2 border">
                      {row.startPlanned?.toDate?.().toLocaleString?.() ?? "-"} – {row.endPlanned?.toDate?.().toLocaleString?.() ?? "-"}
                    </td>
                    <td className="p-2 border">
                      <span className="px-2 py-1 rounded bg-gray-100">{row.status}</span>
                    </td>
                    <td className="p-2 border text-right">
                      <Link href={`/ptw/${row.id}`} className="text-blue-600 hover:underline">Detail</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AuthGate>
  );
}