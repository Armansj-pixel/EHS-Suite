// app/ptw/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { listPTW, PTWWithId as PTW } from "@/lib/ptw";

function fmt(ts: any) {
  if (!ts?.seconds) return "-";
  const d = new Date(ts.seconds * 1000);
  return d.toLocaleString();
}

function StatusBadge({ s }: { s: PTW["status"] }) {
  const color: Record<PTW["status"], string> = {
    Draft: "bg-gray-200 text-gray-800",
    Submitted: "bg-blue-100 text-blue-800",
    Rejected: "bg-red-100 text-red-800",
    Approved: "bg-emerald-100 text-emerald-800",
    Active: "bg-amber-100 text-amber-800",
    Closed: "bg-zinc-200 text-zinc-800",
    Expired: "bg-orange-100 text-orange-800",
    Cancelled: "bg-slate-200 text-slate-800",
  };
  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${color[s]}`}>
      {s}
    </span>
  );
}

export default function PTWListPage() {
  const router = useRouter();
  const [items, setItems] = useState<PTW[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setErr(null);
        const rows = await listPTW(); // sudah client-side sort
        setItems(rows);
      } catch (e: any) {
        console.error(e);
        setErr(e?.message ?? "Gagal memuat PTW");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Permit to Work</h1>
        <button
          onClick={() => router.push("/ptw/new")}
          className="px-4 py-2 rounded bg-black text-white hover:opacity-90"
        >
          + PTW
        </button>
      </div>

      {err && (
        <div className="mb-4 rounded border border-red-200 bg-red-50 text-red-700 px-3 py-2">
          {err}
        </div>
      )}

      {loading ? (
        <p>Memuat…</p>
      ) : items.length === 0 ? (
        <p className="text-zinc-500">Belum ada PTW.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((it) => (
            <li
              key={it.id}
              className="rounded-lg border border-zinc-200 p-4 hover:bg-zinc-50"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-lg">{it.title}</h3>
                    <StatusBadge s={it.status} />
                  </div>
                  <p className="text-sm text-zinc-600">{it.location}</p>
                </div>
                <div className="text-right text-xs text-zinc-500">
                  <div>Dibuat: {fmt(it.createdAt)}</div>
                  <div>Update: {fmt(it.updatedAt)}</div>
                </div>
              </div>
              {it.description && (
                <p className="mt-2 text-sm text-zinc-700">{it.description}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}