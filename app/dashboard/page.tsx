// app/dashboard/page.tsx
import React from "react";
import { fetchKPI } from "@/lib/kpi";

// Komponen kecil untuk tampilan kartu KPI
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

// Komponen utama dashboard
export default async function DashboardPage() {
  let kpi;
  try {
    kpi = await fetchKPI();
  } catch (error) {
    console.error("Gagal memuat KPI:", error);
  }

  return (
    <main className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Dashboard KPI</h1>
        <form action="">
          <button
            formAction=""
            onClick={() => location.reload()}
            className="text-sm px-3 py-1 border rounded hover:bg-gray-50"
          >
            Refresh
          </button>
        </form>
      </div>

      {!kpi ? (
        <div className="text-sm text-red-600">⚠️ Gagal memuat data KPI. Coba refresh ulang.</div>
      ) : (
        <>
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

          <p className="text-xs text-gray-500 mt-4">
            Terakhir diperbarui:{" "}
            <span className="font-medium">
              {new Date(kpi.updatedAt).toLocaleString("id-ID")}
            </span>
          </p>
        </>
      )}
    </main>
  );
}