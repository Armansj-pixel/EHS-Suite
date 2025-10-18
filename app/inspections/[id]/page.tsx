"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { useUserProfile } from "@/lib/useUserProfile";
import { getAuth } from "firebase/auth";

type RiskLevel = "Low" | "Medium" | "High";
type StatusType = "Open" | "In Progress" | "Closed";

type IData = {
  date?: any;
  area?: string;
  findingType?: "Unsafe Act" | "Unsafe Condition" | "Good Practice";
  description?: string;
  riskLevel?: RiskLevel;
  correctiveAction?: string;
  pic?: string;
  status: StatusType;
  followUp?: string;
  createdBy?: string;
  createdAt?: any;
  updatedAt?: any;
  reporterName?: string;
};

export default function InspectionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { profile } = useUserProfile();
  const uid = getAuth().currentUser?.uid || null;
  const myRole = profile?.role || "staff";
  const isManager = ["owner", "ehs_manager", "admin"].includes(myRole);

  const [item, setItem] = useState<IData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const ref = doc(db, "inspections", id);
        const snap = await getDoc(ref);
        if (!snap.exists()) setErr("Data tidak ditemukan.");
        else setItem(snap.data() as any);
      } catch (e: any) {
        setErr(e?.message || "Gagal memuat data.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  function canUpdate() {
    if (!uid || !item) return false;
    return isManager || item.createdBy === uid;
  }

  async function setStatus(status: StatusType) {
    if (!canUpdate()) return;
    try {
      setSaving(true);
      await updateDoc(doc(db, "inspections", id), { status, updatedAt: serverTimestamp() });
      setItem(prev => prev ? { ...prev, status } : prev);
    } catch (e: any) {
      alert(e?.message || "Gagal mengubah status (cek rules).");
    } finally {
      setSaving(false);
    }
  }

  const fmt = (ts?: any, withTime = false) => {
    const d = ts?.toDate?.() instanceof Date ? ts.toDate() : ts instanceof Date ? ts : null;
    if (!d) return "-";
    return withTime ? d.toLocaleString("id-ID") : d.toLocaleDateString("id-ID");
  };

  const riskBadge =
    "px-2 py-1 rounded text-xs " +
    (item?.riskLevel === "High"
      ? "bg-red-100 text-red-700"
      : item?.riskLevel === "Medium"
      ? "bg-amber-100 text-amber-700"
      : "bg-emerald-100 text-emerald-700");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/inspections" className="text-sm text-gray-600 hover:underline">← Kembali</Link>
          <h1 className="text-xl font-semibold">Detail Inspeksi</h1>
        </div>
        {item && canUpdate() && (
          <div className="flex gap-2">
            {item.status !== "Closed" && (
              <button onClick={() => setStatus("Closed")}
                className="px-3 py-2 text-sm bg-gray-900 text-white rounded hover:bg-gray-800" disabled={saving}>
                {saving ? "Menyimpan…" : "Close"}
              </button>
            )}
            {item.status === "Open" && (
              <button onClick={() => setStatus("In Progress")}
                className="px-3 py-2 text-sm border rounded hover:bg-gray-50" disabled={saving}>
                {saving ? "Menyimpan…" : "Mark In Progress"}
              </button>
            )}
            {item.status === "Closed" && (
              <button onClick={() => setStatus("Open")}
                className="px-3 py-2 text-sm border rounded hover:bg-gray-50" disabled={saving}>
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
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white border rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase text-gray-400">{item.findingType || "-"}</div>
                  <h2 className="text-lg font-semibold">{item.area || "-"}</h2>
                  <div className="text-sm text-gray-600">{fmt(item.date || item.createdAt)}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={riskBadge}>{item.riskLevel || "-"}</span>
                  <span className={
                    "px-2 py-1 rounded text-xs " + (
                      item.status === "Open" ? "bg-blue-100 text-blue-700" :
                      item.status === "In Progress" ? "bg-purple-100 text-purple-700" :
                      "bg-gray-200 text-gray-700"
                    )
                  }>{item.status}</span>
                </div>
              </div>

              <div className="text-sm text-gray-700 whitespace-pre-wrap">{item.description || "-"}</div>
            </div>

            <div className="bg-white border rounded-xl p-4">
              <h3 className="font-medium text-gray-800 mb-1">Tindakan Korektif</h3>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{item.correctiveAction || "-"}</p>
            </div>

            <div className="bg-white border rounded-xl p-4">
              <h3 className="font-medium text-gray-800 mb-1">Catatan / Follow Up</h3>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{item.followUp || "-"}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white border rounded-xl p-4 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div className="text-gray-500">PIC</div><div>{item.pic || "-"}</div>
                <div className="text-gray-500">Reporter</div><div>{item.reporterName || "-"}</div>
                <div className="text-gray-500">Dibuat</div><div>{fmt(item.createdAt, true)}</div>
                <div className="text-gray-500">Diupdate</div><div>{fmt(item.updatedAt, true)}</div>
              </div>
            </div>

            <div className="bg-white border rounded-xl p-4 text-xs text-gray-600">
              <div><b>Doc ID:</b> {id}</div>
              <div><b>UID Pembuat:</b> {item.createdBy || "-"}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}