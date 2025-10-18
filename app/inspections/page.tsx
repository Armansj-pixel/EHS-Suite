"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { db } from "@/lib/firebase";
import {
  collection, getDocs, query, orderBy, limit, startAfter, where, updateDoc, doc,
} from "firebase/firestore";
import { useUserProfile } from "@/lib/useUserProfile";
import { getAuth } from "firebase/auth";

type RiskLevel = "Low" | "Medium" | "High";
type StatusType = "Open" | "In Progress" | "Closed";

type IRow = {
  id: string;
  date?: any;
  area?: string;
  findingType?: "Unsafe Act" | "Unsafe Condition" | "Good Practice";
  description?: string;
  riskLevel?: RiskLevel;
  correctiveAction?: string;
  pic?: string;
  status: StatusType;
  followUp?: string;
  createdBy?: string;
  createdAt?: any;
  updatedAt?: any;
  reporterName?: string;
};

const PAGE_SIZE = 20;

export default function InspectionsListPage() {
  const { profile } = useUserProfile();
  const uid = getAuth().currentUser?.uid || null;
  const myRole = profile?.role || "staff";
  const isManager = ["owner", "ehs_manager", "admin"].includes(myRole);

  const [items, setItems] = useState<IRow[]>([]);
  const [last, setLast] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // filters
  const [statusFilter, setStatusFilter] = useState<"All" | StatusType>("All");
  const [riskFilter, setRiskFilter] = useState<"All" | RiskLevel>("All");
  const [search, setSearch] = useState("");

  function buildQuery(start?: any) {
    const col = collection(db, "inspections");
    const clauses: any[] = [];
    if (statusFilter !== "All") clauses.push(where("status", "==", statusFilter));
    if (riskFilter !== "All") clauses.push(where("riskLevel", "==", riskFilter));
    const base = query(col, ...clauses, orderBy("createdAt", "desc"));
    if (start) return query(col, ...clauses, orderBy("createdAt", "desc"), startAfter(start), limit(PAGE_SIZE));
    return query(col, ...clauses, orderBy("createdAt", "desc"), limit(PAGE_SIZE));
  }

  async function loadFirst() {
    setLoading(true); setErr(null);
    try {
      const qRef = buildQuery();
      const snap = await getDocs(qRef);
      const arr: IRow[] = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
      setItems(arr);
      setLast(snap.docs[snap.docs.length - 1] || null);
      setHasMore(snap.docs.length === PAGE_SIZE);
    } catch (e: any) {
      setErr(e?.message || "Gagal memuat data.");
    } finally { setLoading(false); }
  }

  async function loadMore() {
    if (!last) return;
    setLoadingMore(true);
    try {
      const qRef = buildQuery(last);
      const snap = await getDocs(qRef);
      const arr: IRow[] = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
      setItems(prev => [...prev, ...arr]);
      setLast(snap.docs[snap.docs.length - 1] || null);
      setHasMore(snap.docs.length === PAGE_SIZE);
    } catch (e: any) {
      alert(e?.message || "Gagal memuat tambahan.");
    } finally { setLoadingMore(false); }
  }

  useEffect(() => { setItems([]); setLast(null); setHasMore(true); loadFirst(); /* eslint-disable-next-line */ }, [statusFilter, riskFilter]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(it => {
      const a = (it.area || "").toLowerCase();
      const d = (it.description || "").toLowerCase();
      const p = (it.pic || "").toLowerCase();
      return a.includes(q) || d.includes(q) || p.includes(q);
    });
  }, [items, search]);

  const fmt = (ts?: any) => {
    const d = ts?.toDate?.() instanceof Date ? ts.toDate() : ts instanceof Date ? ts : null;
    return d ? d.toLocaleDateString("id-ID") : "-";
  };

  function canUpdate(it: IRow) {
    if (!uid) return false;
    return isManager || it.createdBy === uid;
  }

  async function setStatus(id: string, status: StatusType) {
    try {
      await updateDoc(doc(db, "inspections", id), { status, updatedAt: new Date() });
      setItems(prev => prev.map(it => it.id === id ? { ...it, status } : it));
    } catch (e: any) {
      alert(e?.message || "Gagal ubah status (cek rules).");
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <h1 className="text-xl font-semibold">Inspeksi (Temuan)</h1>
        <div className="flex gap-2">
          <Link href="/inspections/new" className="px-3 py-2 text-sm bg-gray-900 text-white rounded hover:bg-gray-800">+ Inspeksi</Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border rounded-xl p-3 grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="md:col-span-2">
          <label className="text-xs text-gray-500">Cari (Area/Deskripsi/PIC)</label>
          <input value={search} onChange={e=>setSearch(e.target.value)} className="mt-1 border rounded px-3 py-2 w-full text-sm" placeholder="ketik kata kunci…" />
        </div>
        <div>
          <label className="text-xs text-gray-500">Status</label>
          <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value as any)} className="mt-1 border rounded px-3 py-2 w-full text-sm">
            <option>All</option><option>Open</option><option>In Progress</option><option>Closed</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500">Risk</label>
          <select value={riskFilter} onChange={e=>setRiskFilter(e.target.value as any)} className="mt-1 border rounded px-3 py-2 w-full text-sm">
            <option>All</option><option>Low</option><option>Medium</option><option>High</option>
          </select>
        </div>
        <div className="md:col-span-4 flex gap-2">
          <button onClick={loadFirst} className="px-3 py-2 text-sm border rounded hover:bg-gray-50">Terapkan</button>
          {loading && <span className="text-sm text-gray-500 self-center">Memuat…</span>}
        </div>
      </div>

      {err && <div className="text-sm text-red-600">⚠ {err}</div>}

      {/* Table */}
      <div className="overflow-x-auto bg-white border rounded-xl">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-gray-600 border-b">
              <th className="py-2 px-3">Tanggal</th>
              <th className="py-2 px-3">Area</th>
              <th className="py-2 px-3">Temuan</th>
              <th className="py-2 px-3">Risk</th>
              <th className="py-2 px-3">PIC</th>
              <th className="py-2 px-3">Status</th>
              <th className="py-2 px-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(it => (
              <tr key={it.id} className="border-b last:border-none">
                <td className="py-2 px-3 whitespace-nowrap">{fmt(it.date || it.createdAt)}</td>
                <td className="py-2 px-3">{it.area || "-"}</td>
                <td className="py-2 px-3">
                  <Link href={`/inspections/${it.id}`} className="hover:underline">
                    {it.findingType || "-"} — {(it.description || "").slice(0, 48)}
                  </Link>
                </td>
                <td className="py-2 px-3">
                  <span className={
                    "px-2 py-1 rounded text-xs " + (
                      it.riskLevel === "High" ? "bg-red-100 text-red-700" :
                      it.riskLevel === "Medium" ? "bg-amber-100 text-amber-700" :
                      "bg-emerald-100 text-emerald-700"
                    )
                  }>
                    {it.riskLevel || "-"}
                  </span>
                </td>
                <td className="py-2 px-3">{it.pic || "-"}</td>
                <td className="py-2 px-3">
                  <span className={
                    "px-2 py-1 rounded text-xs " + (
                      it.status === "Open" ? "bg-blue-100 text-blue-700" :
                      it.status === "In Progress" ? "bg-purple-100 text-purple-700" :
                      "bg-gray-200 text-gray-700"
                    )
                  }>
                    {it.status}
                  </span>
                </td>
                <td className="py-2 px-3 text-right">
                  {canUpdate(it) ? (
                    <>
                      {it.status !== "Closed" && (
                        <button onClick={()=>setStatus(it.id, "Closed")}
                          className="px-3 py-1.5 text-xs bg-gray-900 text-white rounded hover:bg-gray-800 mr-2">
                          Close
                        </button>
                      )}
                      {it.status === "Open" && (
                        <button onClick={()=>setStatus(it.id, "In Progress")}
                          className="px-3 py-1.5 text-xs border rounded hover:bg-gray-50">
                          Mark In Progress
                        </button>
                      )}
                      {it.status === "Closed" && (
                        <button onClick={()=>setStatus(it.id, "Open")}
                          className="px-3 py-1.5 text-xs border rounded hover:bg-gray-50">
                          Reopen
                        </button>
                      )}
                    </>
                  ) : <span className="text-xs text-gray-400">-</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Load more */}
        <div className="p-3 flex justify-center">
          {hasMore ? (
            <button onClick={loadMore} disabled={loadingMore} className="px-4 py-2 text-sm border rounded hover:bg-gray-50 disabled:opacity-60">
              {loadingMore ? "Memuat…" : "Muat lebih banyak"}
            </button>
          ) : (
            <div className="text-xs text-gray-400">Semua data sudah ditampilkan</div>
          )}
        </div>
      </div>
    </div>
  );
}