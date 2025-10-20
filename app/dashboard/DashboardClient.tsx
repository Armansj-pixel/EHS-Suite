"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import StatCard from "@/components/StatCard";
import SparkBar from "@/components/SparkBar";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

type KpiWindow = { from: string; to: string };
type KpiResult = {
  hazards: number;
  nearmiss: number;
  inspections: number;
  closedHazards: number;
  trendWeekly: number[]; // 7 angka terakhir
};

export default function DashboardClient() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [kpi, setKpi] = useState<KpiResult | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // default window: 7 hari terakhir
  const toISO = (d: Date) => d.toISOString().slice(0, 10);
  const today = new Date();
  const start = new Date();
  start.setDate(today.getDate() - 6);
  const [win, setWin] = useState<KpiWindow>({
    from: toISO(start),
    to: toISO(today),
  });

  useEffect(() => {
    let stop = false;
    (async () => {
      try {
        setLoading(true);
        setErr(null);
        const q = new URLSearchParams(win as any).toString();
        const res = await fetch(`/api/kpi?${q}`, { cache: "no-store" });
        if (!res.ok) throw new Error("Gagal memuat KPI");
        const data = (await res.json()) as KpiResult;
        if (!stop) setKpi(data);
      } catch (e: any) {
        if (!stop) setErr(e?.message ?? "Error");
      } finally {
        if (!stop) setLoading(false);
      }
    })();
    return () => {
      stop = true;
    };
  }, [win.from, win.to]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  return (
    <div className="space-y-6">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-semibold">EHS Suite Dashboard</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={handleLogout}
            className="rounded-lg bg-neutral-900 text-white px-3 py-2 text-sm hover:bg-neutral-800"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Quick Actions (cards) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Link
          href="/hazards/new"
          className="rounded-xl border border-neutral-200 bg-white p-4 hover:shadow-md"
        >
          <div className="text-lg font-semibold">+ Hazard</div>
          <p className="text-sm text-neutral-500">Buat laporan hazard</p>
        </Link>

        <Link
          href="/nearmiss/new"
          className="rounded-xl border border-neutral-200 bg-white p-4 hover:shadow-md"
        >
          <div className="text-lg font-semibold">+ Near Miss</div>
          <p className="text-sm text-neutral-500">Catat kejadian nyaris celaka</p>
        </Link>

        <Link
          href="/inspections"
          className="rounded-xl border border-neutral-200 bg-white p-4 hover:shadow-md"
        >
          <div className="text-lg font-semibold">Inspeksi</div>
          <p className="text-sm text-neutral-500">Checklist & rekap inspeksi</p>
        </Link>

        <Link
          href="/hazards"
          className="rounded-xl border border-neutral-200 bg-white p-4 hover:shadow-md"
        >
          <div className="text-lg font-semibold">Daftar Hazard</div>
          <p className="text-sm text-neutral-500">Lihat & tutup tiket</p>
        </Link>

        <Link
          href="/ptw"
          className="col-span-2 md:col-span-1 rounded-xl border border-neutral-200 bg-white p-4 hover:shadow-md"
        >
          <div className="text-lg font-semibold">Permit to Work</div>
          <p className="text-sm text-neutral-500">Buat & kelola PTW</p>
        </Link>
      </div>

      {/* KPI Panel */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-xl font-semibold">Dashboard KPI</h2>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={win.from}
              onChange={(e) => setWin((w) => ({ ...w, from: e.target.value }))}
              className="rounded-md border border-neutral-300 px-2 py-1 text-sm"
            />
            <span className="text-neutral-400">→</span>
            <input
              type="date"
              value={win.to}
              onChange={(e) => setWin((w) => ({ ...w, to: e.target.value }))}
              className="rounded-md border border-neutral-300 px-2 py-1 text-sm"
            />
          </div>
        </div>

        {err && (
          <p className="mt-3 text-sm text-red-600">⚠ {err}</p>
        )}

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Hazard"
            value={kpi?.hazards ?? (loading ? "…" : 0)}
            subtitle="Dalam rentang tanggal"
            trend={undefined}
          />
          <StatCard
            label="Near Miss"
            value={kpi?.nearmiss ?? (loading ? "…" : 0)}
          />
          <StatCard
            label="Inspeksi"
            value={kpi?.inspections ?? (loading ? "…" : 0)}
          />
          <StatCard
            label="Hazard Closed"
            value={kpi?.closedHazards ?? (loading ? "…" : 0)}
          />
        </div>

        {/* Sparkline simple */}
        <div className="mt-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-neutral-500">
              Aktivitas 7 hari terakhir (hazard + nearmiss + inspeksi)
            </p>
            <span className="text-xs text-neutral-400">
              {loading ? "memuat…" : "update realtime"}
            </span>
          </div>
          <div className="mt-2 rounded-xl border border-neutral-200 p-3">
            <SparkBar values={kpi?.trendWeekly ?? [0, 0, 0, 0, 0, 0, 0]} />
          </div>
        </div>
      </div>
    </div>
  );
}