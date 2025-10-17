"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  getCountFromServer,
  query,
  where,
  // orderBy, limit // (opsional kalau nanti mau filter periode)
} from "firebase/firestore";

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
  const [kpi, setKpi] = useState<KPIData | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    try {
      setLoading(true);
      setErr(null);

      // Ambil count langsung dari Firestore (pakai auth user yang sedang login)
      const [inspections, hazards, hirarcOpen, ptwActive] = await Promise.all([
        count("inspections"),
        count("hazard_reports"),
        count("hirarc", { field: "status", value: "Open" }),
        count("ptw", { field: "status", value: "Approved" }),
      ]);

      setKpi({
        inspections,
        hazards,
        hirarcOpen,
        ptwActive,
        updatedAt: Date.now(),
      });
    } catch (e: any) {
      console.error(e);
      setErr(e?.message ?? "Gagal memuat KPI");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-600">
          {kpi ? `Terakhir diperbarui: ${new Date(kpi.updatedAt).toLocaleString("id-ID")}` : "—"}
        </p>
        <button
          onClick={load}
          className="text-sm px-3 py-1 border rounded hover:bg-gray-50"
          disabled={loading}
        >
          {loading ? "Menyegarkan..." : "Refresh"}
        </button>
      </div>

      {err && <div className="text-sm text-red-600 mb-3">⚠️ {err}</div>}

      {loading && !kpi ? (
        <div className="text-sm text-gray-500">Memuat KPI…</div>
      ) : kpi ? (
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
      ) : (
        <div className="text-sm text-gray-500">Tidak ada data KPI.</div>
      )}
    </div>
  );
}