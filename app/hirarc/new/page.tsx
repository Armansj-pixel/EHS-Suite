"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { db } from "@/lib/firebase";
import { useUserProfile } from "@/lib/useUserProfile";

type RiskLevel = "Low" | "Medium" | "High";
type HStatus = "Open" | "Closed";

function toRiskLevel(score: number): RiskLevel {
  if (score >= 15) return "High";     // 15–25
  if (score >= 6) return "Medium";    // 6–14
  return "Low";                       // 1–5
}

export default function NewHIRARCPage() {
  const router = useRouter();
  const { profile } = useUserProfile();

  const [activity, setActivity] = useState("");
  const [hazard, setHazard] = useState("");
  const [consequence, setConsequence] = useState("");
  const [likelihood, setLikelihood] = useState(3);
  const [severity, setSeverity] = useState(3);
  const [existingControls, setExistingControls] = useState("");
  const [additionalControls, setAdditionalControls] = useState("");
  const [owner, setOwner] = useState(profile?.name || "");
  const [dueDate, setDueDate] = useState<string>("");
  const [status, setStatus] = useState<HStatus>("Open");

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const riskScore = useMemo(() => likelihood * severity, [likelihood, severity]);
  const riskLevel: RiskLevel = useMemo(() => toRiskLevel(riskScore), [riskScore]);

  async function submit() {
    setErr(null);
    if (!activity.trim()) return setErr("Activity wajib diisi.");
    if (!hazard.trim()) return setErr("Hazard wajib diisi.");
    if (!consequence.trim()) return setErr("Consequence wajib diisi.");
    setLoading(true);
    try {
      const uid = getAuth().currentUser?.uid;
      if (!uid) throw new Error("Anda belum login.");

      const due = dueDate ? new Date(dueDate) : null;

      await addDoc(collection(db, "hirarc"), {
        activity: activity.trim(),
        hazard: hazard.trim(),
        consequence: consequence.trim(),
        likelihood,
        severity,
        riskScore,
        riskLevel,                 // Low / Medium / High
        existingControls: existingControls.trim(),
        additionalControls: additionalControls.trim(),
        owner: owner.trim(),
        dueDate: due,
        status,                    // Open / Closed
        // metadata
        createdBy: uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      router.push("/hirarc");
    } catch (e: any) {
      console.error(e);
      setErr(e?.message || "Gagal menyimpan HIRARC.");
    } finally {
      setLoading(false);
    }
  }

  const badge =
    riskLevel === "High"
      ? "bg-red-100 text-red-700"
      : riskLevel === "Medium"
      ? "bg-amber-100 text-amber-700"
      : "bg-emerald-100 text-emerald-700";

  return (
    <div className="space-y-5 max-w-3xl">
      <h1 className="text-xl font-semibold">Tambah HIRARC</h1>
      {err && <div className="text-sm text-red-600">⚠ {err}</div>}

      <div className="bg-white border rounded-xl p-4 space-y-3">
        <div>
          <label className="text-sm text-gray-600">Activity/Task</label>
          <input className="mt-1 border rounded px-3 py-2 w-full text-sm"
                 placeholder="Contoh: Winding coil tembaga"
                 value={activity} onChange={e=>setActivity(e.target.value)} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-sm text-gray-600">Hazard</label>
            <input className="mt-1 border rounded px-3 py-2 w-full text-sm"
                   placeholder="Contoh: Tumpahan oli, kabel melintang, guarding terbuka"
                   value={hazard} onChange={e=>setHazard(e.target.value)} />
          </div>
          <div>
            <label className="text-sm text-gray-600">Consequence</label>
            <input className="mt-1 border rounded px-3 py-2 w-full text-sm"
                   placeholder="Contoh: Tergelincir, cedera, terbakar"
                   value={consequence} onChange={e=>setConsequence(e.target.value)} />
          </div>
        </div>

        {/* Matrix inputs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-sm text-gray-600">Likelihood (1–5)</label>
            <input type="number" min={1} max={5}
                   className="mt-1 border rounded px-3 py-2 w-full text-sm"
                   value={likelihood} onChange={e=>setLikelihood(Number(e.target.value))}/>
          </div>
          <div>
            <label className="text-sm text-gray-600">Severity (1–5)</label>
            <input type="number" min={1} max={5}
                   className="mt-1 border rounded px-3 py-2 w-full text-sm"
                   value={severity} onChange={e=>setSeverity(Number(e.target.value))}/>
          </div>
          <div className="flex items-end gap-2">
            <div className="w-full">
              <div className="text-sm text-gray-600">Risk Score</div>
              <div className="mt-1 px-3 py-2 border rounded text-sm bg-gray-50">{riskScore}</div>
            </div>
            <div className="w-full">
              <div className="text-sm text-gray-600">Risk Level</div>
              <div className={`mt-1 px-3 py-2 border rounded text-sm ${badge}`}>{riskLevel}</div>
            </div>
          </div>
        </div>

        <div>
          <label className="text-sm text-gray-600">Existing Controls</label>
          <textarea className="mt-1 border rounded px-3 py-2 w-full text-sm min-h-20"
                    placeholder="Kontrol yang sudah ada (engineering, admin, signage, housekeeping)"
                    value={existingControls} onChange={e=>setExistingControls(e.target.value)} />
        </div>

        <div>
          <label className="text-sm text-gray-600">Additional Controls (Rencana)</label>
          <textarea className="mt-1 border rounded px-3 py-2 w-full text-sm min-h-20"
                    placeholder="Kontrol tambahan yang diusulkan (guarding, SOP, training, APD, dsb.)"
                    value={additionalControls} onChange={e=>setAdditionalControls(e.target.value)} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-sm text-gray-600">PIC / Owner</label>
            <input className="mt-1 border rounded px-3 py-2 w-full text-sm"
                   placeholder="Nama penanggung jawab"
                   value={owner} onChange={e=>setOwner(e.target.value)} />
          </div>
          <div>
            <label className="text-sm text-gray-600">Due Date</label>
            <input type="date" className="mt-1 border rounded px-3 py-2 w-full text-sm"
                   value={dueDate} onChange={e=>setDueDate(e.target.value)} />
          </div>
          <div>
            <label className="text-sm text-gray-600">Status</label>
            <select className="mt-1 border rounded px-3 py-2 w-full text-sm"
                    value={status} onChange={e=>setStatus(e.target.value as HStatus)}>
              <option value="Open">Open</option>
              <option value="Closed">Closed</option>
            </select>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <button onClick={submit} disabled={loading}
                  className="px-4 py-2 bg-gray-900 text-white rounded text-sm hover:bg-gray-800 disabled:opacity-60">
            {loading ? "Menyimpan…" : "Simpan"}
          </button>
          <a href="/hirarc" className="px-4 py-2 border rounded text-sm">Batal</a>
        </div>
      </div>

      <div className="text-xs text-gray-500">
        Skala contoh: Likelihood &amp; Severity = 1 (sangat rendah) … 5 (sangat tinggi).  
        Risk Level: 1–5 Low, 6–14 Medium, 15–25 High.
      </div>
    </div>
  );
}