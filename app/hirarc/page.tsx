"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  startAfter,
  updateDoc,
  doc,
  where,
} from "firebase/firestore";
import { useUserProfile } from "@/lib/useUserProfile";
import { getAuth } from "firebase/auth";

type HDoc = {
  id: string;
  activity?: string;
  hazard?: string;
  consequence?: string;
  likelihood?: number;
  severity?: number;
  riskScore?: number;
  riskLevel?: "Low" | "Medium" | "High";
  existingControls?: string;
  additionalControls?: string;
  owner?: string;
  dueDate?: any;
  status: "Open" | "Closed";
  createdBy?: string;
  createdAt?: any;
  updatedAt?: any;
};

const PAGE_SIZE = 20;

export default function HIRARCListPage() {
  const { profile } = useUserProfile();

  // states
  const [items, setItems] = useState<HDoc[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [last, setLast] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);

  // filters
  const [statusFilter, setStatusFilter] = useState<"All" | "Open" | "Closed">("All");
  const [riskFilter, setRiskFilter] = useState<"All" | "Low" | "Medium" | "High">("All");
  const [search, setSearch] = useState<string>("");

  const uid = getAuth().currentUser?.uid || null;
  const myRole = profile?.role || "staff";
  const isManager = ["owner", "ehs_manager", "admin"].includes(myRole);

  // Build Firestore query based on filters
  function buildQuery(start?: any) {
    const col = collection(db, "hirarc");
    const clauses: any[] = [];
    if (statusFilter !== "All") clauses.push(where("status", "==", statusFilter));
    if (riskFilter !== "All") clauses.push(where("riskLevel", "==", riskFilter));
    // Catatan: pencarian keyword dilakukan client-side (tanpa full-text index)
    // agar tidak menambah dependency; export akan ikut hasil client-side.

    const base = query(col, ...clauses, orderBy("createdAt", "desc"));
    if (start) {
      return query(col, ...clauses, orderBy("createdAt", "desc"), startAfter(start), limit(PAGE_SIZE));
    }
    return query(col, ...clauses, orderBy("createdAt", "desc"), limit(PAGE_SIZE));
  }

  async function loadFirst() {
    setLoading(true);
    setErr(null);
    try {
      const qRef = buildQuery();
      const snap = await getDocs(qRef);
      const arr: HDoc[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      setItems(arr);
      setLast(snap.docs[snap.docs.length - 1] || null);
      setHasMore(snap.docs.length === PAGE_SIZE);
    } catch (e: any) {
      console.error(e);
      setErr(e?.message || "Gagal memuat HIRARC.");
    } finally {
      setLoading(false);
    }
  }

  async function loadMore() {
    if (!last) return;
    setLoadingMore(true);
    setErr(null);
    try {
      const qRef = buildQuery(last);
      const snap = await getDocs(qRef);
      const arr: HDoc[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      setItems((prev) => [...prev, ...arr]);
      setLast(snap.docs[snap.docs.length - 1] || null);
      setHasMore(snap.docs.length === PAGE_SIZE);
    } catch (e: any) {
      console.error(e);
      setErr(e?.message || "Gagal memuat data tambahan.");
    } finally {
      setLoadingMore(false);
    }
  }

  // reload saat filter berubah
  useEffect(() => {
    setItems([]);
    setLast(null);
    setHasMore(true);
    loadFirst();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, riskFilter]);

  // client-side search (activity/hazard/owner)
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) => {
      const a = (it.activity || "").toLowerCase();
      const h = (it.hazard || "").toLowerCase();
      const o = (it.owner || "").toLowerCase();
      return a.includes(q) || h.includes(q) || o.includes(q);
    });
  }, [items, search]);

  async function closeItem(id: string) {
    try {
      await updateDoc(doc(db, "hirarc", id), {
        status: "Closed",
        updatedAt: new Date(),
      });
      setItems((prev) => prev.map((it) => (it.id === id ? { ...it, status: "Closed" } : it)));
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "Gagal menutup item (cek izin / rules).");
    }
  }

  function canClose(it: HDoc) {
    if (it.status !== "Open") return false;
    if (!uid) return false;
    return isManager || it.createdBy === uid;
  }

  const fmtDate = (ts?: any) => {
    const d = ts?.toDate?.() instanceof Date ? ts.toDate() : ts instanceof Date ? ts : null;
    return d ? d.toLocaleDateString("id-ID") : "-";
  };

  const riskBadge = (level?: string) =>
    "px-2 py-1 rounded text-xs " +
    (level === "High"
      ? "bg-red-100 text-red-700"
      : level === "Medium"
      ? "bg-amber-100 text-amber-700"
      : "bg-emerald-100 text-emerald-700");

  // Export CSV (mengambil data yang sedang ada di memori + hasil filter client-side)
  function exportCSV() {
    const rows = [
      [
        "Tanggal",
        "Aktivitas",
        "Hazard",
        "Consequence",
        "Likelihood",
        "Severity",
        "RiskScore",
        "RiskLevel",
        "PIC",
        "DueDate",
        "Status",
        "DocID",
      ],
      ...filtered.map((it) => [
        fmtDate(it.createdAt),
        safeCSV(it.activity),
        safeCSV(it.hazard),
        safeCSV(it.consequence),
        it.likelihood ?? "",
        it.severity ?? "",
        it.riskScore ?? "",
        it.riskLevel ?? "",
        safeCSV(it.owner),
        fmtDate(it.dueDate),
        it.status,
        it.id,
      ]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const date = new Date().toISOString().slice(0, 10);
    a.download = `hirarc_export_${date}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function safeCSV(v?: string) {
    if (!v) return "";
    // bungkus dengan kutip bila ada koma atau newline
    if (v.includes(",") || v.includes("\n") || v.includes('"')) {
      return `"${v.replace(/"/g, '""')}"`;
    }
    return v;
  }

  function printPage() {
    // gunakan dialog print → user bisa simpan ke PDF
    window.print();
  }

  function resetFilters() {
    setStatusFilter("All");
    setRiskFilter("All");
    setSearch("");
  }

  return (
    <div className="space-y-4">
      {/* Header + Aksi */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <h1 className="text-xl font-semibold">HIRARC</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/hirarc/new" className="px-3 py-2 text-sm bg-gray-900 text-white rounded hover:bg-gray-800">
            + HIRARC
          </Link>
          <button onClick={exportCSV} className="px-3 py-2 text-sm border rounded hover:bg-gray-50">
            Export CSV
          </button>
          <button onClick={printPage} className="px-3 py-2 text-sm border rounded hover:bg-gray-50">
            Cetak / Simpan PDF
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-white border rounded-xl p-3 grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="md:col-span-2">
          <label className="text-xs text-gray-500">Cari (Activity / Hazard / PIC)</label>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ketik kata kunci…"
            className="mt-1 border rounded px-3 py-2 w-full text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="mt-1 border rounded px-3 py-2 w-full text-sm"
          >
            <option value="All">All</option>
            <option value="Open">Open</option>
            <option value="Closed">Closed</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500">Risk Level</label>
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value as any)}
            className="mt-1 border rounded px-3 py-2 w-full text-sm"
          >
            <option value="All">All</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
        </div>
        <div className="md:col-span-4 flex gap-2">
          <button onClick={loadFirst} className="px-3 py-2 text-sm border rounded hover:bg-gray-50">
            Terapkan
          </button>
          <button onClick={resetFilters} className="px-3 py-2 text-sm border rounded hover:bg-gray-50">
            Reset
          </button>
          {loading && <span className="text-sm text-gray-500 self-center">Memuat…</span>}
        </div>
      </div>

      {err && <div className="text-sm text-red-600">⚠ {err}</div>}

      {/* Tabel */}
      {!loading && filtered.length === 0 ? (
        <div className="text-sm text-gray-500">Tidak ada data yang cocok.</div>
      ) : (
        <div className="overflow-x-auto bg-white border rounded-xl">
          <table className="min-w-full text-sm print:text-xs">
            <thead>
              <tr className="text-left text-gray-600 border-b">
                <th className="py-2 px-3">Tanggal</th>
                <th className="py-2 px-3">Aktivitas</th>
                <th className="py-2 px-3">Hazard</th>
                <th className="py-2 px-3">Risk</th>
                <th className="py-2 px-3">PIC</th>
                <th className="py-2 px-3">Due</th>
                <th className="py-2 px-3">Status</th>
                <th className="py-2 px-3 text-right print:hidden">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((it) => (
                <tr key={it.id} className="border-b last:border-none">
                  <td className="py-2 px-3 whitespace-nowrap">{fmtDate(it.createdAt)}</td>
                  <td className="py-2 px-3">
                    <Link href={`/hirarc/${it.id}`} className="hover:underline">
                      {it.activity || "-"}
                    </Link>
                  </td>
                  <td className="py-2 px-3">{it.hazard || "-"}</td>
                  <td className="py-2 px-3">
                    <span className={riskBadge(it.riskLevel)} title={`Score: ${it.riskScore ?? "-"}`}>
                      {it.riskLevel || "-"}
                    </span>
                  </td>
                  <td className="py-2 px-3">{it.owner || "-"}</td>
                  <td className="py-2 px-3">{fmtDate(it.dueDate)}</td>
                  <td className="py-2 px-3">
                    <span
                      className={
                        "px-2 py-1 rounded text-xs " +
                        (it.status === "Open" ? "bg-blue-100 text-blue-700" : "bg-gray-200 text-gray-700")
                      }
                    >
                      {it.status}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-right print:hidden">
                    {it.status === "Open" && canClose(it) ? (
                      <button
                        className="px-3 py-1.5 text-xs bg-gray-900 text-white rounded hover:bg-gray-800"
                        onClick={() => closeItem(it.id)}
                      >
                        Close
                      </button>
                    ) : (
                      <span className="text-xs text-gray-400">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Load more */}
          <div className="p-3 flex justify-center print:hidden">
            {hasMore ? (
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="px-4 py-2 text-sm border rounded hover:bg-gray-50 disabled:opacity-60"
              >
                {loadingMore ? "Memuat…" : "Muat lebih banyak"}
              </button>
            ) : (
              <div className="text-xs text-gray-400">Semua data sudah ditampilkan</div>
            )}
          </div>
        </div>
      )}

      <style jsx global>{`
        @media print {
          a[href]:after { content: ""; }
          button, .print\\:hidden { display: none !important; }
          table { page-break-inside: auto; }
          tr { page-break-inside: avoid; page-break-after: auto; }
        }
      `}</style>
    </div>
  );
}