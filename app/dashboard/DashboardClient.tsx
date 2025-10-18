"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { db } from "@/lib/firebase";
import {
  collection,
  getCountFromServer,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from "firebase/firestore";

type KPIData = {
  inspections: number;
  hazards: number;
  hirarcOpen: number;
  ptwActive: number;
  updatedAt: number;
};

type HazardRow = {
  id: string;
  date?: string;
  area?: string;
  type?: "Hazard" | "Near Miss";
  riskLevel?: "Low" | "Medium" | "High";
  status?: "Open" | "In Progress" | "Closed";
  description?: string;
  createdByEmail?: string;
  createdAt?: any;
};

function KpiCard({
  title,
  value,
  status,
}: {
  title: string;
  value: number;
  status: "ok" | "warn" | "alert";
}) {
  const ring =
    status === "alert"
      ? "ring-red-500"
      : status === "warn"
      ? "ring-yellow-500"
      : "ring-emerald-500";
  return (
    <div className={`rounded-xl border border-gray-200 p-4 ring-1 ${ring} bg-white`}>
      <div className="text-sm text-gray-500">{title}</div>
      <div className="text-3xl font-semibold mt-1">{value}</div>
    </div>
  );
}

async function count(col: string, filter?: { field: string; value: any }) {
  const ref = collection(db, col);
  const q = filter ? query(ref, where(filter.field, "==", filter.value)) : ref;
  const snap = await getCountFromServer(q);
  return snap.data().count ?? 0;
}

async function getRecentHazards(limitSize = 5): Promise<HazardRow[]> {
  const ref = collection(db, "hazard_reports");
  const q = query(ref, orderBy("createdAt", "desc"), limit(limitSize));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
}

export default function DashboardClient() {
  const [ready, setReady] = useState(false);
  const [kpi, setKpi] = useState<KPIData | null>(null);
  const [hazards, setHazards] = useState<HazardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    try {
      setLoading(true);
      setErr(null);

      const [inspections, hazardsCount, hirarcOpen, ptwActive, recentHazards] =
        await Promise.all([
          count("inspections"),
          count("hazard_reports"),
          count("hirarc", { field: "status", value: "Open" }),
          count("ptw", { field: "status", value: "Approved" }),
          getRecentHazards(5),
        ]);

      setKpi({
        inspections,
        hazards: hazardsCount,
        hirarcOpen,
        ptwActive,
        updatedAt: Date.now(),
      });
      setHazards(recentHazards);
    } catch (e: any) {
      console.error(e);
      setErr(e?.message ?? "Gagal memuat data dashboard");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const auth = getAuth();
    const unsub = onAuthStateChanged(auth, (u) => {
      setReady(!!u);
      if (u) load();
    });
    return () => unsub();
  }, []);

  if (!ready) {
    return <div className="text-sm text-gray-500">Menyiapkan sesi…</div>;
  }

  const riskBadge = (r?: string) =>
    `px-2 py-0.5 rounded text-xs ${
      r === "High"
        ? "bg-red-100 text-red-700"
        : r === "Medium"
        ? "bg-yellow-100 text-yellow-700"
        : "bg-gray-100 text-gray-700"
    }`;

  const statusBadge = (s?: string) =>
    `px-2 py-0.5 rounded text-xs ${
      s === "Closed"
        ? "bg-emerald-100 text-emerald-700"
        : s === "In Progress"
        ? "bg-yellow-100 text-yellow-700"
        : "bg-red-100 text-red-700"
    }`;

  return (
    <div className="space-y-6">
      {/* Bar atas: timestamp, refresh, dan quick actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="text-sm text-gray-600">
          {kpi ? `Terakhir diperbarui: ${new Date(kpi.updatedAt).toLocaleString("id-ID")}` : "—"}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={load}
            className="text-sm px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-60"
            disabled={loading}
          >
            {loading ? "Menyegarkan..." : "Refresh"}
          </button>

          {/* Quick links Inspeksi */}
          <Link href="/inspections" className="text-sm px-3 py-1 border rounded hover:bg-gray-50">
            Lihat Inspeksi
          </Link>
          <Link
            href="/inspections/new"
            className="text-sm px-3 py-1 rounded bg-emerald-600 text-white hover:opacity-90"
          >
            + Tambah Inspeksi
          </Link>

          {/* Quick links Hazard */}
          <Link href="/hazards" className="text-sm px-3 py-1 border rounded hover:bg-gray-50">
            Lihat Hazard
          </Link>
          <Link
            href="/hazards/new"
            className="text-sm px-3 py-1 rounded bg-red-600 text-white hover:opacity-90"
          >
            + Tambah Hazard
          </Link>
        </div>
      </div>

      {/* Error / loading */}
      {err && <div className="text-sm text-red-600">⚠️ {err}</div>}
      {loading && !kpi && <div className="text-sm text-gray-500">Memuat data…</div>}

      {/* Grid KPI */}
      {kpi && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard title="Inspeksi" value={kpi.inspections} status="ok" />
          <KpiCard
            title="Hazard / Near Miss"
            value={kpi.hazards}
            status={kpi.hazards > 5 ? "warn" : "ok"}
          />
          <KpiCard
            title="HIRARC Open"
            value={kpi.hirarcOpen}
            status={kpi.hirarcOpen > 5 ? "alert" : "ok"}
          />
          <KpiCard title="PTW Aktif" value={kpi.ptwActive} status="ok" />
        </div>
      )}

      {/* Ringkasan Hazard Terbaru */}
      <section className="bg-white rounded-xl border">
        <div className="p-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Hazard & Near Miss Terbaru</h3>
          <div className="flex gap-2">
            <Link href="/hazards" className="text-sm px-3 py-1 border rounded hover:bg-gray-50">
              Lihat Semua
            </Link>
            <Link
              href="/hazards/new"
              className="text-sm px-3 py-1 rounded bg-red-600 text-white hover:opacity-90"
            >
              + Tambah Hazard
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
                <th className="text-left p-2">Status</th>
                <th className="text-left p-2">Pelapor</th>
                <th className="text-left p-2">Deskripsi</th>
              </tr>
            </thead>
            <tbody>
              {loading && hazards.length === 0 ? (
                <tr>
                  <td className="p-3 text-gray-500" colSpan={7}>
                    Memuat…
                  </td>
                </tr>
              ) : hazards.length === 0 ? (
                <tr>
                  <td className="p-3 text-gray-500" colSpan={7}>
                    Belum ada laporan
                  </td>
                </tr>
              ) : (
                hazards.map((h) => (
                  <tr key={h.id} className="border-t align-top">
                    <td className="p-2 whitespace-nowrap">{h.date ?? "-"}</td>
                    <td className="p-2 whitespace-nowrap">{h.area ?? "-"}</td>
                    <td className="p-2">
                      <span className="px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-700">
                        {h.type ?? "-"}
                      </span>
                    </td>
                    <td className="p-2">
                      <span className={riskBadge(h.riskLevel)}>{h.riskLevel ?? "-"}</span>
                    </td>
                    <td className="p-2">
                      <span className={statusBadge(h.status)}>{h.status ?? "-"}</span>
                    </td>
                    <td className="p-2 whitespace-nowrap">{h.createdByEmail ?? "-"}</td>
                    <td className="p-2 max-w-[360px]">
                      {h.description ?? "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}