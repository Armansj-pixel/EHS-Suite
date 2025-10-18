"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { db } from "@/lib/firebase";
import { useUserProfile } from "@/lib/useUserProfile";

type RiskLevel = "Low" | "Medium" | "High";
type NearMissStatus = "Open" | "Closed";

const CATEGORIES = [
  "Housekeeping – Area kerja berantakan",
  "Kelistrikan – Kabel/Instalasi",
  "Mekanikal – Peralatan bergerak",
  "Kebakaran – Material mudah terbakar",
  "Ergonomi – Posisi kerja/angkat beban",
  "Kimia – Tumpahan/pewangi/pelarut",
  "Lingkungan – Pencahayaan/Kebisingan",
  "Lainnya",
];

export default function NewNearMissPage() {
  const router = useRouter();
  const { profile } = useUserProfile();

  // default tanggal = hari ini
  const [dateStr, setDateStr] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate()
    ).padStart(2, "0")}`;
  });

  // form states
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [description, setDescription] = useState("");
  const [immediateAction, setImmediateAction] = useState("");
  const [recommendations, setRecommendations] = useState("");
  const [riskLevel, setRiskLevel] = useState<RiskLevel>("Medium");
  const [status, setStatus] = useState<NearMissStatus>("Open");
  const [reporter, setReporter] = useState<string>(profile?.name || "");

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit() {
    setErr(null);

    // Validasi minimal
    if (!title.trim()) return setErr("Judul wajib diisi.");
    if (!location.trim()) return setErr("Lokasi wajib diisi.");
    if (!description.trim()) return setErr("Deskripsi kejadian wajib diisi.");

    setLoading(true);
    try {
      const auth = getAuth();
      const uid = auth.currentUser?.uid;
      if (!uid) throw new Error("Anda belum login.");

      const eventDate = dateStr ? new Date(dateStr) : new Date();

      await addDoc(collection(db, "hazard_reports"), {
        type: "Near Miss",               // <— pembeda dengan Hazard
        title: title.trim(),
        location: location.trim(),
        category,
        description: description.trim(),
        immediateAction: immediateAction.trim(),
        recommendations: recommendations.trim(),
        riskLevel,                       // "Low" | "Medium" | "High"
        status,                          // "Open" | "Closed"
        reporter: reporter || profile?.name || "",

        // metadata wajib untuk Rules
        createdBy: uid,
        createdAt: serverTimestamp(),

        // tambahan opsional
        eventDate,                       // untuk filter/report
        updatedAt: serverTimestamp(),
      });

      router.push("/hazards"); // Near Miss tampil di daftar yang sama (filter by type jika diinginkan)
    } catch (e: any) {
      console.error(e);
      setErr(e?.message || "Gagal menyimpan Near Miss.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5 max-w-2xl">
      <h1 className="text-xl font-semibold">Laporkan Near Miss</h1>

      {err && <div className="text-sm text-red-600">⚠ {err}</div>}

      <div className="bg-white border rounded-xl p-4 space-y-3">
        <div>
          <label className="text-sm text-gray-600">Judul Kejadian</label>
          <input
            className="mt-1 border rounded px-3 py-2 w-full text-sm"
            placeholder="Contoh: Nyaris tersandung kabel di jalur winding"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-sm text-gray-600">Tanggal Kejadian</label>
            <input
              type="date"
              className="mt-1 border rounded px-3 py-2 w-full text-sm"
              value={dateStr}
              onChange={(e) => setDateStr(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm text-gray-600">Lokasi</label>
            <input
              className="mt-1 border rounded px-3 py-2 w-full text-sm"
              placeholder="Area/Departemen/Pos"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-sm text-gray-600">Kategori</label>
            <select
              className="mt-1 border rounded px-3 py-2 w-full text-sm"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm text-gray-600">Tingkat Risiko</label>
            <select
              className="mt-1 border rounded px-3 py-2 w-full text-sm"
              value={riskLevel}
              onChange={(e) => setRiskLevel(e.target.value as RiskLevel)}
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-sm text-gray-600">Deskripsi Kejadian</label>
          <textarea
            className="mt-1 border rounded px-3 py-2 w-full text-sm min-h-24"
            placeholder="Jelaskan kronologi, potensi akibat, pihak terpapar, dsb."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div>
          <label className="text-sm text-gray-600">Tindakan Langsung</label>
          <textarea
            className="mt-1 border rounded px-3 py-2 w-full text-sm min-h-20"
            placeholder="Apa yang segera dilakukan untuk mengendalikan bahaya?"
            value={immediateAction}
            onChange={(e) => setImmediateAction(e.target.value)}
          />
        </div>

        <div>
          <label className="text-sm text-gray-600">Rekomendasi Perbaikan</label>
          <textarea
            className="mt-1 border rounded px-3 py-2 w-full text-sm min-h-20"
            placeholder="Usulan rekayasa, administrasi, APD, housekeeping, dsb."
            value={recommendations}
            onChange={(e) => setRecommendations(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-sm text-gray-600">Status</label>
            <select
              className="mt-1 border rounded px-3 py-2 w-full text-sm"
              value={status}
              onChange={(e) => setStatus(e.target.value as NearMissStatus)}
            >
              <option value="Open">Open</option>
              <option value="Closed">Closed</option>
            </select>
          </div>

          <div>
            <label className="text-sm text-gray-600">Pelapor</label>
            <input
              className="mt-1 border rounded px-3 py-2 w-full text-sm"
              placeholder="Nama pelapor"
              value={reporter}
              onChange={(e) => setReporter(e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-1">
              *Akan disimpan juga <code>createdBy</code> (UID) secara otomatis.
            </p>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            onClick={submit}
            disabled={loading}
            className="px-4 py-2 bg-gray-900 text-white rounded text-sm hover:bg-gray-800 disabled:opacity-60"
          >
            {loading ? "Menyimpan…" : "Simpan"}
          </button>
          <a href="/hazards" className="px-4 py-2 border rounded text-sm">
            Batal
          </a>
        </div>
      </div>

      <div className="text-xs text-gray-500">
        Tips: Near Miss = kejadian nyaris celaka tanpa korban. Gunakan kategori
        paling relevan. Status <b>Open</b> saat dibuat; <b>Closed</b> jika sudah tuntas.
      </div>
    </div>
  );
}