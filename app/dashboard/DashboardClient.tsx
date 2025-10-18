"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { db } from "@/lib/firebase";
import { collection, getCountFromServer, query, where } from "firebase/firestore";

type KPIData = {
  inspections: number;
  hazards: number;
  hirarcOpen: number;
  ptwActive: number;
  updatedAt: number;
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

export default function DashboardClient() {
  const [ready, setReady] = useState(false);
  const [kpi, setKpi] = useState<KPIData | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    try {
      setLoading(true);
      setErr(null);
      const [inspections, hazards, hirarcOpen, ptwActive] = await Promise.all([
        count("inspections"),
        count("hazard_reports"),
        count("hirarc", { field: "status", value: "Open" }),
        count("ptw", { field: "status", value: "Approved" }),
      ]);
      setKpi({ inspections, hazards, hirarcOpen, ptwActive, updatedAt: Date.now() });
    } catch (e: any) {
      console.error(e);
      setErr(e?.message ?? "Gagal memuat KPI");
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

  return (
    <div className="space-y-4">
      {/* Bar atas: timestamp, refresh, dan quick actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="text-sm text-gray-600">
          {kpi ? `Terakhir diperbarui: ${new Date(kpi.updatedAt).toLocaleString("id-ID")}` : "—"}
        </div>
        <div className="flex gap-2">
          <button
            onClick={load}
            className="text-sm px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-60"
            disabled={loading}
          >
            {loading ? "Menyegarkan..." : "Refresh"}
          </button>
          <Link
            href="/inspections"
            className="text-sm px-3 py-1 border rounded hover:bg-gray-50"
          >
            Lihat Inspeksi
          </Link>
          <Link
            href="/inspections/new"
            className="text-sm px-3 py-1 rounded bg-emerald-600 text-white hover:opacity-90"
          >
            + Tambah Inspeksi
          </Link>
        </div>
      </div>

      {/* Error / loading */}
      {err && <div className="text-sm text-red-600">⚠️ {err}</div>}
      {loading && !kpi && <div className="text-sm text-gray-500">Memuat KPI…</div>}

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
    </div>
  );
}