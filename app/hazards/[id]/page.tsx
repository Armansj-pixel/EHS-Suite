"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { useUserProfile } from "@/lib/useUserProfile";
import { getAuth } from "firebase/auth";

type HazardDoc = {
  title?: string;
  description?: string;
  category?: string;
  riskLevel?: "Low" | "Medium" | "High";
  status: "Open" | "Closed";
  location?: string;
  reporter?: string;
  createdBy?: string;
  createdAt?: any;  // Firestore Timestamp
  updatedAt?: any;
  eventDate?: any;
  immediateAction?: string;
  recommendations?: string;
  type?: string; // "Hazard" | "Near Miss"
};

export default function HazardDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { profile } = useUserProfile();
  const uid = getAuth().currentUser?.uid || null;

  const [item, setItem] = useState<HazardDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const myRole = profile?.role || "staff";
  const isManager = ["owner", "ehs_manager", "admin"].includes(myRole);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const ref = doc(db, "hazard_reports", params.id);
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          setErr("Data tidak ditemukan.");
        } else {
          setItem(snap.data() as any);
        }
      } catch (e: any) {
        console.error(e);
        setErr(e?.message || "Gagal memuat data.");
      } finally {
        setLoading(false);
      }
    })();
  }, [params.id]);

  function canUpdate() {
    if (!item || !uid) return false;
    return isManager || item.createdBy === uid;
  }

  async function setStatus(status: "Open" | "Closed") {
    if (!canUpdate()) return;
    try {
      setSaving(true);
      await updateDoc(doc(db, "hazard_reports", params.id), {
        status,
        updatedAt: serverTimestamp(),
      });
      setItem((prev) => (prev ? { ...prev, status } : prev));
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "Gagal mengubah status (cek rules/izin).");
    } finally {
      setSaving(false);
    }
  }

  const fmtDateTime = (ts?: any) => {
    const d =
      ts?.toDate?.() instanceof Date
        ? ts.toDate()
        : ts instanceof Date
        ? ts
        : null;
    return d ? d.toLocaleString("id-ID") : "-";
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/hazards" className="text-sm text-gray-600 hover:underline">
            ← Kembali
          </Link>
          <h1 className="text-xl font-semibold">Detail Hazard</h1>
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
          {/* Kolom kiri: info utama */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white border rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase text-gray-400">
                    {item.type || "Hazard"}
                  </div>
                  <h2 className="text-lg font-semibold">{item.title || "-"}</h2>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={
                      "px-2 py-1 rounded text-xs " +
                      (item.riskLevel === "High"
                        ? "bg-red-100 text-red-700"
                        : item.riskLevel === "Medium"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-emerald-100 text-emerald-700")
                    }
                    title="Risk level"
                  >
                    {item.riskLevel || "-"}
                  </span>
                  <span
                    className={
                      "px-2 py-1 rounded text-xs " +
                      (item.status === "Open"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-gray-200 text-gray-700")
                    }
                    title="Status"
                  >
                    {item.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-700">
                <div>
                  <div className="text-gray-500">Lokasi</div>
                  <div>{item.location || "-"}</div>
                </div>
                <div>
                  <div className="text-gray-500">Kategori</div>
                  <div>{item.category || "-"}</div>
                </div>
                <div>
                  <div className="text-gray-500">Tanggal Kejadian</div>
                  <div>{fmtDateTime(item.eventDate)}</div>
                </div>
                <div>
                  <div className="text-gray-500">Dibuat</div>
                  <div>{fmtDateTime(item.createdAt)}</div>
                </div>
                <div>
                  <div className="text-gray-500">Diperbarui</div>
                  <div>{fmtDateTime(item.updatedAt)}</div>
                </div>
                <div>
                  <div className="text-gray-500">Pelapor</div>
                  <div>{item.reporter || "-"}</div>
                </div>
              </div>
            </div>

            <div className="bg-white border rounded-xl p-4">
              <h3 className="font-medium text-gray-800 mb-1">Deskripsi Bahaya</h3>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {item.description || "-"}
              </p>
            </div>

            <div className="bg-white border rounded-xl p-4">
              <h3 className="font-medium text-gray-800 mb-1">Tindakan Sementara</h3>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {item.immediateAction || "-"}
              </p>
            </div>

            <div className="bg-white border rounded-xl p-4">
              <h3 className="font-medium text-gray-800 mb-1">Saran Perbaikan</h3>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {item.recommendations || "-"}
              </p>
            </div>
          </div>

          {/* Kolom kanan: panel aksi/metadata */}
          <div className="space-y-4">
            <div className="bg-white border rounded-xl p-4">
              <h3 className="font-medium text-gray-800 mb-2">Aksi Cepat</h3>
              <div className="flex flex-col gap-2">
                <Link href="/hazards/new" className="px-3 py-2 text-sm border rounded hover:bg-gray-50">
                  + Laporan Baru
                </Link>
                <Link href="/hazards" className="px-3 py-2 text-sm border rounded hover:bg-gray-50">
                  Lihat Semua Hazard
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

            <div className="bg-white border rounded-xl p-4 text-xs text-gray-600">
              <div><b>ID Dokumen:</b> {params.id}</div>
              <div><b>Dibuat oleh (UID):</b> {item.createdBy || "-"}</div>
              <div><b>Tipe:</b> {item.type || "Hazard"}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}