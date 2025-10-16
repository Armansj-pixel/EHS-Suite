"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createHIRARC } from "@/lib/firestore";
import { getCurrentUserProfile, redirectIfUnauthorized } from "@/lib/auth";
import { useEffect } from "react";

const RISK = ["Low", "Medium", "High"] as const;
const STATUS = ["Open", "In Progress", "Closed"] as const;

export default function NewHIRARCPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // simple auth guard: hanya owner/ehs_manager/supervisor yang boleh create
  useEffect(() => {
    getCurrentUserProfile().then((u) => {
      redirectIfUnauthorized(u, ["owner", "ehs_manager", "supervisor"]);
    });
  }, []);

  const [form, setForm] = useState({
    area: "Winding",
    jobTask: "",
    hazards: "",
    controls: "",
    riskBefore: "High" as (typeof RISK)[number],
    riskAfter: "Medium" as (typeof RISK)[number],
    status: "Open" as (typeof STATUS)[number],
  });

  function set<K extends keyof typeof form>(key: K, val: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // basic validation
    if (!form.jobTask.trim()) {
      setError("Job Task wajib diisi.");
      return;
    }
    if (!form.area.trim()) {
      setError("Area wajib diisi.");
      return;
    }

    setLoading(true);
    try {
      const hazards = form.hazards
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const controls = form.controls
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      await createHIRARC({
        area: form.area.trim(),
        jobTask: form.jobTask.trim(),
        hazards,
        controls,
        riskBefore: form.riskBefore,
        riskAfter: form.riskAfter,
        owner: "<uid>", // TODO: ganti dengan uid user aktif jika perlu simpan owner
        status: form.status,
      });

      router.push("/hirarc");
    } catch (err: any) {
      setError(err?.message ?? "Gagal menyimpan HIRARC.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">New HIRARC</h1>
      </div>

      <form onSubmit={onSubmit} className="space-y-4 bg-white p-5 rounded-2xl border shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-neutral-600">Area</label>
            <input
              className="input"
              value={form.area}
              onChange={(e) => set("area", e.target.value)}
              placeholder="Contoh: Winding / Phase Assembly"
              required
            />
          </div>
          <div>
            <label className="text-sm text-neutral-600">Job Task</label>
            <input
              className="input"
              value={form.jobTask}
              onChange={(e) => set("jobTask", e.target.value)}
              placeholder="Contoh: Coil Winding / Brazing / LOTO"
              required
            />
          </div>
        </div>

        <div>
          <label className="text-sm text-neutral-600">Hazards (pisahkan dengan koma)</label>
          <input
            className="input"
            value={form.hazards}
            onChange={(e) => set("hazards", e.target.value)}
            placeholder="Pinch point, Noise, Dust"
          />
        </div>

        <div>
          <label className="text-sm text-neutral-600">Controls (pisahkan dengan koma)</label>
          <input
            className="input"
            value={form.controls}
            onChange={(e) => set("controls", e.target.value)}
            placeholder="Guard, Gloves, Earplug, SOP"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm text-neutral-600">Risk Before</label>
            <select
              className="input"
              value={form.riskBefore}
              onChange={(e) => set("riskBefore", e.target.value as any)}
            >
              {RISK.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm text-neutral-600">Risk After</label>
            <select
              className="input"
              value={form.riskAfter}
              onChange={(e) => set("riskAfter", e.target.value as any)}
            >
              {RISK.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm text-neutral-600">Status</label>
            <select
              className="input"
              value={form.status}
              onChange={(e) => set("status", e.target.value as any)}
            >
              {STATUS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex items-center gap-3">
          <button className="btn" disabled={loading}>
            {loading ? "Saving..." : "Save HIRARC"}
          </button>
          <button
            type="button"
            className="px-4 py-2 rounded-lg border"
            onClick={() => history.back()}
          >
            Cancel
          </button>
        </div>
      </form>

      <p className="text-xs text-neutral-500">
        Tip: tambahkan foto/lampiran & matrix scoring (Severity × Likelihood) pada versi berikutnya.
      </p>
    </div>
  );
}