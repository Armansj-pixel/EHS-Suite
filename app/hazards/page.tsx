"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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
} from "firebase/firestore";
import { useUserProfile } from "@/lib/useUserProfile";
import { getAuth } from "firebase/auth";

type HazardDoc = {
  id: string;
  title?: string;
  description?: string;
  category?: string;
  riskLevel?: "Low" | "Medium" | "High";
  status: "Open" | "Closed";
  location?: string;
  reporter?: string;
  createdBy?: string;
  createdAt?: any; // Firestore Timestamp
  eventDate?: any;
};

const PAGE_SIZE = 20;

export default function HazardsPage() {
  const { profile } = useUserProfile();
  const [items, setItems] = useState<HazardDoc[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [last, setLast] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);

  const auth = getAuth();
  const uid = auth.currentUser?.uid || null;
  const myRole = profile?.role || "staff";
  const isManager = ["owner", "ehs_manager", "admin"].includes(myRole);

  async function loadFirst() {
    setLoading(true);
    setErr(null);
    try {
      const q = query(
        collection(db, "hazard_reports"),
        orderBy("createdAt", "desc"),
        limit(PAGE_SIZE)
      );
      const snap = await getDocs(q);

      const arr: HazardDoc[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      }));

      setItems(arr);
      setLast(snap.docs[snap.docs.length - 1] || null);
      setHasMore(snap.docs.length === PAGE_SIZE);
    } catch (e: any) {
      console.error(e);
      setErr(e?.message || "Gagal memuat hazard.");
    } finally {
      setLoading(false);
    }
  }

  async function loadMore() {
    if (!last) return;
    setLoadingMore(true);
    setErr(null);
    try {
      const q = query(
        collection(db, "hazard_reports"),
        orderBy("createdAt", "desc"),
        startAfter(last),
        limit(PAGE_SIZE)
      );
      const snap = await getDocs(q);
      const arr: HazardDoc[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      }));
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

  useEffect(() => {
    loadFirst();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function closeHazard(id: string) {
    try {
      await updateDoc(doc(db, "hazard_reports", id), {
        status: "Closed",
        updatedAt: new Date(),
      });
      setItems((prev) =>
        prev.map((it) => (it.id === id ? { ...it, status: "Closed" } : it))
      );
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "Gagal menutup hazard (cek izin / rules).");
    }
  }

  function canClose(item: HazardDoc) {
    if (item.status !== "Open") return false;
    if (!uid) return false;
    return isManager || item.createdBy === uid;
  }

  const fmt = (ts?: any) => {
    const d =
      ts?.toDate?.() instanceof Date
        ? ts.toDate()
        : ts instanceof Date
        ? ts
        : null;
    return d ? d.toLocaleString("id-ID") : "-";
  };

  return (
    <div className="space-y-4">
      {/* Header + Aksi */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Daftar Hazard</h1>
        <div className="flex gap-2">
          <Link href="/nearmiss/new" className="px-3 py-2 text-sm border rounded hover:bg-gray-50">
            + Near Miss
          </Link>
          <Link href="/hazards/new" className="px-3 py-2 text-sm bg-gray-900 text-white rounded hover:bg-gray-800">
            + Hazard
          </Link>
        </div>
      </div>

      {err && <div className="text-sm text-red-600">⚠ {err}</div>}
      {loading && <div className="text-sm text-gray-500">Memuat data…</div>}

      {/* Tabel */}
      {!loading && items.length === 0 ? (
        <div className="text-sm text-gray-500">Belum ada data hazard.</div>
      ) : (
        <div className="overflow-x-auto bg-white border rounded-xl">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-600 border-b">
                <th className="py-2 px-3">Tanggal</th>
                <th className="py-2 px-3">Judul</th>
                <th className="py-2 px-3">Lokasi</th>
                <th className="py-2 px-3">Kategori</th>
                <th className="py-2 px-3">Risk</th>
                <th className="py-2 px-3">Status</th>
                <th className="py-2 px-3">Pelapor</th>
                <th className="py-2 px-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.id} className="border-b last:border-none">
                  <td className="py-2 px-3 whitespace-nowrap">{fmt(it.createdAt) }</td>
                  <td className="py-2 px-3">{it.title || "-"}</td>
                  <td className="py-2 px-3">{it.location || "-"}</td>
                  <td className="py-2 px-3">{it.category || "-"}</td>
                  <td className="py-2 px-3">
                    <span
                      className={
                        "px-2 py-1 rounded text-xs " +
                        (it.riskLevel === "High"
                          ? "bg-red-100 text-red-700"
                          : it.riskLevel === "Medium"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-emerald-100 text-emerald-700")
                      }
                    >
                      {it.riskLevel || "-"}
                    </span>
                  </td>
                  <td className="py-2 px-3">
                    <span
                      className={
                        "px-2 py-1 rounded text-xs " +
                        (it.status === "Open"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-200 text-gray-700")
                      }
                    >
                      {it.status}
                    </span>
                  </td>
                  <td className="py-2 px-3">{it.reporter || "-"}</td>
                  <td className="py-2 px-3 text-right">
                    {canClose(it) ? (
                      <button
                        className="px-3 py-1.5 text-xs bg-gray-900 text-white rounded hover:bg-gray-800"
                        onClick={() => closeHazard(it.id)}
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
          <div className="p-3 flex justify-center">
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

      <div className="text-xs text-gray-500">
        Catatan: Tombol <b>Close</b> hanya muncul untuk pembuat laporan atau role
        <code> owner / ehs_manager / admin</code>, dan hanya untuk status <b>Open</b>.
      </div>
    </div>
  );
}