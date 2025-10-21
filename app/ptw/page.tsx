"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { listPTW, PTWWithId } from "@/lib/ptw";

export default function PTWListPage() {
  const [items, setItems] = useState<PTWWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        const rows = await listPTW();
        setItems(rows); // ✅ sekarang tipenya cocok
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Permit to Work</h1>
        <button
          className="px-3 py-2 rounded bg-black text-white"
          onClick={() => router.push("/ptw/new")}
        >
          + PTW
        </button>
      </div>

      {loading ? (
        <div className="text-gray-500">Memuat…</div>
      ) : items.length === 0 ? (
        <div className="text-gray-500">Belum ada PTW.</div>
      ) : (
        <ul className="divide-y border rounded">
          {items.map((ptw) => (
            <li
              key={ptw.id}
              className="p-3 hover:bg-gray-50 cursor-pointer"
              onClick={() => router.push(`/ptw/${ptw.id}`)}
            >
              <div className="font-medium">{ptw.title}</div>
              <div className="text-sm text-gray-500">
                {ptw.location} • {ptw.status}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}