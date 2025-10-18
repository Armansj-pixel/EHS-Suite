"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
  Timestamp,
  QueryConstraint,
} from "firebase/firestore";

type HazardType = "Hazard" | "Near Miss";
type RiskLevel = "Low" | "Medium" | "High";
type Status = "Open" | "In Progress" | "Closed";

type Row = {
  id: string;
  date?: string;           // "YYYY-MM-DD"
  area?: string;
  type?: HazardType;
  riskLevel?: RiskLevel;
  status?: Status;
  description?: string;
  createdByEmail?: string;
  createdAt?: any;         // Firestore Timestamp
};

export default function HazardsClient() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  // filters
  const [type, setType] = useState<"" | HazardType>("");
  const [status, setStatus] = useState<"" | Status>("");
  const [risk, setRisk] = useState<"" | RiskLevel>("");
  const [qText, setQText] = useState("");
  const [from, setFrom] = useState<string>(""); // YYYY-MM-DD
  const [to, setTo] = useState<string>("");     // YYYY-MM-DD

  useEffect(() => {
    setLoading(true);

    const constraints: QueryConstraint[] = [orderBy("createdAt", "desc")];
    if (type) constraints.push(where("type", "==", type));
    if (status) constraints.push(where("status", "==", status));
    if (risk) constraints.push(where("riskLevel", "==", risk));

    // date range → filter pakai field `date` (string "YYYY-MM-DD")
    // ini hemat biaya dibanding filter Timestamp.
    if (from) constraints.push(where("date", ">=", from));
    if (to) constraints.push(where("date", "<=", to));

    const ref = collection(db, "hazard_reports");
    const q = query(ref, ...constraints);

    const unsub = onSnapshot(
      q,
      (snap) => {
        const list: Row[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
        setRows(list);
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setRows([]);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [type, status, risk, from, to]);

  const filtered = useMemo(() => {
    if (!qText.trim()) return rows;
    const ql = qText.toLowerCase();
    return rows.filter((r) => {
      const hay =
        `${r.date ?? ""} ${r.area ?? ""} ${r.description ?? ""} ${r.createdByEmail ?? ""} ${r.type ?? ""} ${r.status ?? ""} ${r.riskLevel ?? ""}`.toLowerCase();
      return hay.includes(ql);
    });
  }, [rows, qText]);

  const badgeStatus = (s?: string) =>
    `px-2 py-0.5 rounded text-xs ${
      s === "Closed"
        ? "bg-emerald-100 text-emerald-700"
        : s === "In Progress"
        ? "bg-yellow-100 text-yellow-700"
        : "bg-red-100 text-red-700"
    }`;
  const badgeRisk = (r?: string) =>
    `px-2 py-0.5 rounded text-xs ${
      r === "High"
        ? "bg-red-100 text-red-700"
        : r === "Medium"
        ? "bg-yellow-100 text-yellow-700"
        : "bg-gray-100 text-gray-700"
    }`;

  return (
    <div className="bg-white rounded-xl border">
      {/* Filters */}
      <div className="p-4 flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          <select value={type} onChange={(e) => setType(e.target.value as any)} className="px-3 py-1 border rounded text-sm">
            <option value="">Semua Jenis</option>
            <option value="Hazard">Hazard</option>
            <option value="Near Miss">Near Miss</option>
          </select>

          <select value={status} onChange={(e) => setStatus(e.target.value as any)} className="px-3 py-1 border rounded text-sm">
            <option value="">Semua Status</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Closed">Closed</option>
          </select>

          <select value={risk} onChange={(e) => setRisk(e.target.value as any)} className="px-3 py-1 border rounded text-sm">
            <option value="">Semua Risk</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>

          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="px-3 py-1 border rounded text-sm"
          />
          <span className="text-sm text-gray-500 self-center">s.d.</span>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="px-3 py-1 border rounded text-sm"
          />

          <input
            value={qText}
            onChange={(e) => setQText(e.target.value)}
            placeholder="Cari deskripsi/area/pelapor…"
            className="px-3 py-1 border rounded text-sm flex-1 min-w-[200px]"
          />

          <Link
            href="/hazards/new"
            className="px-3 py-1 rounded bg-red-600 text-white text-sm hover:opacity-90"
          >
            + Tambah Laporan
          </Link>
        </div>
        <div className="text-xs text-gray-500">
          Live update aktif (onSnapshot) — data otomatis berubah saat ada laporan baru.
        </div>
      </div>

      {/* Tabel */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="text-left p-2">Tanggal</th>
              <th className="text-left p-2">Area</th>
              <th className="text-left p-2">Jenis</th>
              <th className="text-left p-2">Risk</th>
              <th className="text-left p-2">Status</th>
              <th className="text-left p-2">Pelapor</th>
              <th className="text-left p-2">Deskripsi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="p-3 text-gray-500" colSpan={7}>Memuat…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td className="p-3 text-gray-500" colSpan={7}>Tidak ada data sesuai filter.</td></tr>
            ) : (
              filtered.map((r) => (
                <tr key={r.id} className="border-t align-top">
                  <td className="p-2 whitespace-nowrap">{r.date ?? "-"}</td>
                  <td className="p-2 whitespace-nowrap">{r.area ?? "-"}</td>
                  <td className="p-2"><span className="px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-700">{r.type ?? "-"}</span></td>
                  <td className="p-2"><span className={badgeRisk(r.riskLevel)}>{r.riskLevel ?? "-"}</span></td>
                  <td className="p-2"><span className={badgeStatus(r.status)}>{r.status ?? "-"}</span></td>
                  <td className="p-2 whitespace-nowrap">{r.createdByEmail ?? "-"}</td>
                  <td className="p-2 max-w-[420px]">{r.description ?? "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}