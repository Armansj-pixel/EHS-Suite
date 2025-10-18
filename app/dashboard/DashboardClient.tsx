"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type KpiData = {
  period: { from: string; to: string };
  totals: {
    hazards: number;
    hazardsOpen: number;
    hazardsClosed: number;
    nearmiss: number;
    inspections: number;
  };
  trendMonthly: Array<{ month: string; hazards: number; nearmiss: number; inspections: number }>;
  hazardsByStatus: Array<{ name: string; value: number }>;
  recentActivities: Array<{
    type: "hazard" | "nearmiss" | "inspection";
    id: string;
    title: string;
    createdAt: string;
    status?: string;
  }>;
};

export default function DashboardClient() {
  const router = useRouter();
  const search = useSearchParams();

  const [from, setFrom] = useState<string>(search.get("from") ?? "");
  const [to, setTo] = useState<string>(search.get("to") ?? "");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [data, setData] = useState<KpiData | null>(null);

  const qs = useMemo(() => {
    const p = new URLSearchParams();
    if (from) p.set("from", new Date(from).toISOString());
    if (to) p.set("to", new Date(to).toISOString());
    return p.toString();
  }, [from, to]);

  async function load() {
    try {
      setLoading(true);
      setErr(null);
      const res = await fetch(`/api/kpi${qs ? "?" + qs : ""}`, { cache: "no-store" });
      if (!res.ok) throw new Error(await res.text());
      const json = (await res.json()) as KpiData;
      setData(json);
    } catch (e: any) {
      console.error(e);
      setErr("Gagal memuat KPI");
    } finally {
      setLoading(false);
    }
  }

  // initial load
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // auto-refresh ringan tiap 30 detik
  useEffect(() => {
    const iv = setInterval(() => load(), 30_000);
    return () => clearInterval(iv);
  }, [qs]);

  const onApply = () => {
    const p = new URLSearchParams();
    if (from) p.set("from", from);
    if (to) p.set("to", to);
    router.replace(`/dashboard${p.toString() ? "?" + p.toString() : ""}`);
    load();
  };

  return (
    <div className="space-y-6">
      {/* Filter Periode */}
      <div className="bg-white border rounded-xl p-4 flex flex-col md:flex-row gap-3 md:items-end">
        <div>
          <label className="text-sm text-gray-600">Dari</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="mt-1 border rounded px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-sm text-gray-600">Sampai</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="mt-1 border rounded px-3 py-2 text-sm"
          />
        </div>
        <div className="md:ml-auto">
          <button
            onClick={onApply}
            className="px-4 py-2 rounded bg-gray-900 text-white text-sm hover:bg-gray-800"
            disabled={loading}
          >
            {loading ? "Memuat…" : "Terapkan"}
          </button>
        </div>
      </div>

      {/* Info status */}
      {loading && <div className="text-sm text-gray-500">Memuat KPI…</div>}
      {err && <div className="text-sm text-red-600">⚠ {err}</div>}

      {/* Kartu KPI */}
      {data && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <KpiCard title="Hazard" value={data.totals.hazards} />
            <KpiCard title="Open" value={data.totals.hazardsOpen} />
            <KpiCard title="Closed" value={data.totals.hazardsClosed} />
            <KpiCard title="Near Miss" value={data.totals.nearmiss} />
            <KpiCard title="Inspeksi" value={data.totals.inspections} />
          </div>

          {/* Ringkasan Tren (tanpa grafik) */}
          <div className="bg-white border rounded-xl p-4">
            <h3 className="font-medium text-gray-800 mb-2">Tren 6 Bulan (Ringkas)</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-600 border-b">
                    <th className="py-2 pr-4">Bulan</th>
                    <th className="py-2 pr-4">Hazard</th>
                    <th className="py-2 pr-4">Near Miss</th>
                    <th className="py-2 pr-4">Inspeksi</th>
                  </tr>
                </thead>
                <tbody>
                  {data.trendMonthly.map((m) => (
                    <tr key={m.month} className="border-b last:border-none">
                      <td className="py-2 pr-4">{m.month}</td>
                      <td className="py-2 pr-4">{m.hazards}</td>
                      <td className="py-2 pr-4">{m.nearmiss}</td>
                      <td className="py-2 pr-4">{m.inspections}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Komposisi Status Hazard (tanpa grafik) */}
          <div className="bg-white border rounded-xl p-4">
            <h3 className="font-medium text-gray-800 mb-2">Status Hazard</h3>
            <ul className="text-sm text-gray-700 list-disc pl-5">
              {data.hazardsByStatus.map((s) => (
                <li key={s.name}>
                  {s.name}: <span className="font-semibold">{s.value}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Aktivitas Terbaru */}
          <div className="bg-white border rounded-xl p-4">
            <h3 className="font-medium text-gray-800 mb-3">Aktivitas Terbaru</h3>
            {data.recentActivities.length === 0 ? (
              <div className="text-sm text-gray-500">Belum ada data.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-600 border-b">
                      <th className="py-2 pr-4">Tanggal</th>
                      <th className="py-2 pr-4">Tipe</th>
                      <th className="py-2 pr-4">Judul</th>
                      <th className="py-2 pr-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentActivities.map((r) => (
                      <tr key={`${r.type}-${r.id}`} className="border-b last:border-none">
                        <td className="py-2 pr-4">
                          {new Date(r.createdAt).toLocaleString("id-ID")}
                        </td>
                        <td className="py-2 pr-4 capitalize">{r.type}</td>
                        <td className="py-2 pr-4">{r.title}</td>
                        <td className="py-2 pr-4">{r.status ?? "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="text-xs text-gray-500 mt-2">
              Periode:{" "}
              {new Date(data.period.from).toLocaleDateString("id-ID")} —{" "}
              {new Date(data.period.to).toLocaleDateString("id-ID")}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function KpiCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="bg-white border rounded-xl p-4">
      <div className="text-xs text-gray-500 mb-1">{title}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  );
}