"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  collection,
  getDocs,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

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
    if (from) p.set("from", from);
    if (to) p.set("to", to);
    return p.toString();
  }, [from, to]);

  async function load() {
    try {
      setLoading(true);
      setErr(null);

      // periode default: 6 bulan terakhir
      const toDate = to ? new Date(to) : new Date();
      const fromDate = from
        ? new Date(from)
        : new Date(toDate.getFullYear(), toDate.getMonth() - 5, 1);

      const fromTs = Timestamp.fromDate(fromDate);
      const toTs = Timestamp.fromDate(
        new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate(), 23, 59, 59)
      );

      const hazardsRef = collection(db, "hazard_reports");
      const inspectionsRef = collection(db, "inspections");

      const [hazardsSnap, inspectionsSnap] = await Promise.all([
        getDocs(query(hazardsRef, where("createdAt", ">=", fromTs), where("createdAt", "<=", toTs))),
        getDocs(query(inspectionsRef, where("createdAt", ">=", fromTs), where("createdAt", "<=", toTs))),
      ]);

      const fmtMonth = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const buckets = new Map<string, { hazards: number; nearmiss: number; inspections: number }>();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(toDate.getFullYear(), toDate.getMonth() - i, 1);
        buckets.set(fmtMonth(d), { hazards: 0, nearmiss: 0, inspections: 0 });
      }

      let hazards = 0;
      let hazardsOpen = 0;
      let hazardsClosed = 0;
      let nearmiss = 0;
      let inspections = 0;
      let recent: KpiData["recentActivities"] = [];

      hazardsSnap.forEach((docu) => {
        const d: any = docu.data();
        const created: Date = d.createdAt?.toDate?.() ?? new Date();
        const key = fmtMonth(new Date(created.getFullYear(), created.getMonth(), 1));
        const typeStr = (d.type ?? d.category ?? "").toLowerCase();
        const isNearMiss = typeStr.includes("near");

        if (!buckets.has(key)) buckets.set(key, { hazards: 0, nearmiss: 0, inspections: 0 });
        if (isNearMiss) {
          nearmiss++;
          buckets.get(key)!.nearmiss++;
        } else {
          hazards++;
          buckets.get(key)!.hazards++;
        }

        const status = d.status ?? "Open";
        if (status === "Open") hazardsOpen++;
        if (status === "Closed") hazardsClosed++;

        recent.push({
          type: isNearMiss ? "nearmiss" : "hazard",
          id: docu.id,
          title: d.title ?? d.description ?? "Hazard Report",
          createdAt: created.toISOString(),
          status,
        });
      });

      inspectionsSnap.forEach((docu) => {
        const d: any = docu.data();
        const created: Date = d.createdAt?.toDate?.() ?? new Date();
        const key = fmtMonth(new Date(created.getFullYear(), created.getMonth(), 1));
        if (!buckets.has(key)) buckets.set(key, { hazards: 0, nearmiss: 0, inspections: 0 });
        buckets.get(key)!.inspections++;
        inspections++;
        recent.push({
          type: "inspection",
          id: docu.id,
          title: d.area ?? d.title ?? "Inspection",
          createdAt: created.toISOString(),
        });
      });

      recent.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
      recent = recent.slice(0, 10);

      const trendMonthly = Array.from(buckets.entries())
        .sort((a, b) => (a[0] < b[0] ? -1 : 1))
        .map(([month, v]) => ({ month, ...v }));

      setData({
        period: { from: fromDate.toISOString(), to: toDate.toISOString() },
        totals: { hazards, hazardsOpen, hazardsClosed, nearmiss, inspections },
        trendMonthly,
        hazardsByStatus: [
          { name: "Open", value: hazardsOpen },
          { name: "Closed", value: hazardsClosed },
        ],
        recentActivities: recent,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="mt-1 border rounded px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="text-sm text-gray-600">Sampai</label>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="mt-1 border rounded px-3 py-2 text-sm" />
        </div>
        <div className="md:ml-auto">
          <button onClick={onApply} className="px-4 py-2 rounded bg-gray-900 text-white text-sm hover:bg-gray-800" disabled={loading}>
            {loading ? "Memuat…" : "Terapkan"}
          </button>
        </div>
      </div>

      {loading && <div className="text-sm text-gray-500">Memuat KPI…</div>}
      {err && <div className="text-sm text-red-600">⚠ {err}</div>}

      {data && (
        <>
          {/* Kartu KPI */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <KpiCard title="Hazard" value={data.totals.hazards} />
            <KpiCard title="Open" value={data.totals.hazardsOpen} />
            <KpiCard title="Closed" value={data.totals.hazardsClosed} />
            <KpiCard title="Near Miss" value={data.totals.nearmiss} />
            <KpiCard title="Inspeksi" value={data.totals.inspections} />
          </div>

          {/* Tren ringkas */}
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
            <div className="text-xs text-gray-500 mt-2">
              Periode: {new Date(data.period.from).toLocaleDateString("id-ID")} —{" "}
              {new Date(data.period.to).toLocaleDateString("id-ID")}
            </div>
          </div>

          {/* Aktivitas terbaru */}
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
                        <td className="py-2 pr-4">{new Date(r.createdAt).toLocaleString("id-ID")}</td>
                        <td className="py-2 pr-4 capitalize">{r.type}</td>
                        <td className="py-2 pr-4">{r.title}</td>
                        <td className="py-2 pr-4">{r.status ?? "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
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