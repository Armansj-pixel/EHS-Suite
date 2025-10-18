"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { useUserProfile } from "@/lib/useUserProfile";
import { getAuth } from "firebase/auth";

type HDoc = {
  activity?: string;
  hazard?: string;
  consequence?: string;
  likelihood?: number;
  severity?: number;
  riskScore?: number;
  riskLevel?: "Low" | "Medium" | "High";
  existingControls?: string;
  additionalControls?: string;
  owner?: string;
  dueDate?: any;
  status: "Open" | "Closed";
  createdBy?: string;
  createdAt?: any;
  updatedAt?: any;
};

export default function HIRARCDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { profile } = useUserProfile();

  const [item, setItem] = useState<HDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const uid = getAuth().currentUser?.uid || null;
  const myRole = profile?.role || "staff";
  const isManager = ["owner", "ehs_manager", "admin"].includes(myRole);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const ref = doc(db, "hirarc", id);
        const snap = await getDoc(ref);
        if (!snap.exists()) setErr("Data tidak ditemukan.");
        else setItem(snap.data() as any);
      } catch (e: any) {
        console.error(e);
        setErr(e?.message || "Gagal memuat data.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  function canUpdate() {
    if (!item || !uid) return false;
    return isManager || item.createdBy === uid;
  }

  async function setStatus(status: "Open" | "Closed") {
    if (!canUpdate()) return;
    try {
      setSaving(true);
      await updateDoc(doc(db, "hirarc", id), { status, updatedAt: serverTimestamp() });
      setItem((prev) => (prev ? { ...prev, status } : prev));
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "Gagal mengubah status (cek rules/izin).");
    } finally {
      setSaving(false);
    }
  }

  const fmt = (ts?: any, withTime = true) => {
    const d = ts?.toDate?.() instanceof Date ? ts.toDate() : ts instanceof Date ? ts : null;
    if (!d) return "-";
    return withTime ? d.toLocaleString("id-ID") : d.toLocaleDateString("id-ID");
    };

  const badge =
    item?.riskLevel === "High"
      ? "bg-red-100 text-red-700"
      : item?.riskLevel === "Medium"
      ? "bg-amber-100 text-amber-700"
      : "bg-emerald-100 text-emerald-700";

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/hirarc" className="text-sm text-gray-600 hover:underline">← Kembali</Link>
          <h1 className="text-xl font-semibold">Detail HIRARC</h1>
        </div>
        {item && canUpdate() && (
          <div className="flex gap-2">
            {item.status === "Open" ? (
              <button
                onClick={() => setStatus("Closed")}
                disabled={saving}
                className="px-3 py-2 text-sm bg-gray-900 text-white rounded hover:bg-gray-800 disabled:opacity-60"
              >
                {saving ? "Menyimpan…" : "Tutup (Close)"}
              </button>
            ) : (
              <button
                onClick={() => setStatus("Open")}
                disabled={saving}
                className="px-3 py-2 text-sm border rounded hover:bg-gray-50 disabled:opacity-60"
              >
                {saving ? "Menyimpan…" : "Reopen"}
              </button>
            )}
          </div>
        )}
      </div>

      {err && <div className="text-sm text-red-600">⚠ {err}</div>}
      {loading && <div className="text-sm text-gray-500">Memuat data…</div>}

      {item && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Info utama */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white border rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase text-gray-400">HIRARC</div>
                  <h2 className="text-lg font-semibold">{item.activity || "-"}</h2>
                  <div className="text-sm text-gray-600">{item.hazard || "-"}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded text-xs ${badge}`} title={`Score: ${item.riskScore ?? "-"}`}>
                    {item.riskLevel || "-"}
                  </span>
                  <span
                    className={
                      "px-2 py-1 rounded text-xs " +
                      (item.status === "Open" ? "bg-blue-100 text-blue-700" : "bg-gray-200 text-gray-700")
                    }
                  >
                    {item.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-gray-700 mt-2">
                <div>
                  <div className="text-gray-500">Consequence</div>
                  <div>{item.consequence || "-"}</div>
                </div>
                <div>
                  <div className="text-gray-500">Lk x Sv</div>
                  <div>{item.likelihood ?? "-"} × {item.severity ?? "-"} = <b>{item.riskScore ?? "-"}</b></div>
                </div>
                <div>
                  <div className="text-gray-500">PIC</div>
                  <div>{item.owner || "-"}</div>
                </div>
              </div>
            </div>

            <div className="bg-white border rounded-xl p-4">
              <h3 className="font-medium text-gray-800 mb-1">Existing Controls</h3>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{item.existingControls || "-"}</p>
            </div>

            <div className="bg-white border rounded-xl p-4">
              <h3 className="font-medium text-gray-800 mb-1">Additional Controls (Rencana)</h3>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{item.additionalControls || "-"}</p>
            </div>
          </div>

          {/* Panel kanan */}
          <div className="space-y-4">
            <div className="bg-white border rounded-xl p-4 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div className="text-gray-500">Dibuat</div>
                <div>{fmt(item.createdAt)}</div>
                <div className="text-gray-500">Diperbarui</div>
                <div>{fmt(item.updatedAt)}</div>
                <div className="text-gray-500">Due Date</div>
                <div>{fmt(item.dueDate, false)}</div>
              </div>
            </div>

            <div className="bg-white border rounded-xl p-4 text-xs text-gray-600">
              <div><b>ID Dokumen:</b> {id}</div>
              <div><b>Dibuat oleh (UID):</b> {item.createdBy || "-"}</div>
            </div>

            <div className="bg-white border rounded-xl p-4">
              <h3 className="font-medium text-gray-800 mb-2">Aksi Cepat</h3>
              <div className="flex flex-col gap-2">
                <Link href="/hirarc/new" className="px-3 py-2 text-sm border rounded hover:bg-gray-50">
                  + HIRARC Baru
                </Link>
                <Link href="/hirarc" className="px-3 py-2 text-sm border rounded hover:bg-gray-50">
                  Lihat Semua HIRARC
                </Link>
                {item.status === "Open" && canUpdate() && (
                  <button
                    onClick={() => setStatus("Closed")}
                    disabled={saving}
                    className="px-3 py-2 text-sm bg-gray-900 text-white rounded hover:bg-gray-800 disabled:opacity-60"
                  >
                    {saving ? "Menyimpan…" : "Tutup (Close) Sekarang"}
                  </button>
                )}
                {item.status === "Closed" && canUpdate() && (
                  <button
                    onClick={() => setStatus("Open")}
                    disabled={saving}
                    className="px-3 py-2 text-sm border rounded hover:bg-gray-50 disabled:opacity-60"
                  >
                    {saving ? "Menyimpan…" : "Reopen"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}