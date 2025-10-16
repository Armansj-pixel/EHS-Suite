"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { listDocs, type HIRARC, type DocWithId } from "@/lib/firestore";
import { where, orderBy, limit, Timestamp } from "firebase/firestore";

const STATUS = ["All", "Open", "In Progress", "Closed"] as const;
type StatusFilter = typeof STATUS[number];
type HRow = DocWithId<HIRARC> & { createdAt?: Timestamp };

export default function HIRARCListPage() {
  const [items, setItems] = useState<HRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<StatusFilter>("All");
  const [q, setQ] = useState("");

  async function fetchData(s: StatusFilter) {
    setLoading(true);
    setError(null);
    try {
      const constraints =
        s === "All"
          ? [orderBy("createdAt", "desc"), limit(50)]
          : [where("status", "==", s), orderBy("createdAt", "desc"), limit(50)];
      const data = await listDocs<HIRARC>("hirarc", constraints);
      setItems(data as HRow[]);
    } catch (e: any) {
      setError(e?.message ?? "Gagal memuat HIRARC");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData(status);
  }, [status]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return items;
    return items.filter(
      (it) =>
        it.area?.toLowerCase().includes(term) ||
        it.jobTask?.toLowerCase().includes(term) ||
        it.hazards?.join(" ").toLowerCase().includes(term)
    );
  }, [items, q]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-bold">HIRARC</h1>
        <div className="flex items-center gap-2">
          {STATUS.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`px-3 py-1.5 rounded-full border text-sm ${
                status === s
                  ? "bg-black text-white"
                  : "bg-white hover:bg-neutral-100"
              }`}
            >
              {s}
            </button>
          ))}
          <Link href="/hirarc/new" className="btn">
            New HIRARC
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          placeholder="Cari area / task / hazard..."
          className="input max-w-md"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button onClick={() => fetchData(status)} className="btn">
          Refresh
        </button>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p className="text-red-600 text-sm">{error}</p>}

      {!loading && filtered.length === 0 && (
        <p className="text-neutral-500">Belum ada data HIRARC.</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((it) => (
          <div
            key={it.id}
            className="rounded-2xl border bg-white p-4 shadow-sm hover:shadow-md transition"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-neutral-500">{it.area}</p>
              <span
                className={`text-xs px-2 py-0.5 rounded-full border ${
                  it.status === "Closed"
                    ? "bg-green-50 text-green-700 border-green-200"
                    : it.status === "In Progress"
                    ? "bg-amber-50 text-amber-700 border-amber-200"
                    : "bg-blue-50 text-blue-700 border-blue-200"
                }`}
              >
                {it.status}
              </span>
            </div>

            <h3 className="mt-1 text-base font-semibold">{it.jobTask}</h3>

            <div className="mt-2 text-sm">
              <div>
                Risk:{" "}
                <span className="font-medium">{it.riskBefore}</span> →{" "}
                <span className="font-medium">{it.riskAfter}</span>
              </div>
              {it.hazards?.length ? (
                <div className="mt-1 text-neutral-600 truncate">
                  Hazards: {it.hazards.join(", ")}
                </div>
              ) : null}
            </div>

            <div className="mt-3 text-xs text-neutral-500">
              {it.createdAt &&
                `Created: ${it.createdAt.toDate().toLocaleString()}`}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}