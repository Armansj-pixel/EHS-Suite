// app/ptw/new/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createPTW, PTWStatus } from "@/lib/ptw";

export default function PTWNewPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<PTWStatus>("Submitted");

  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<{ type: "error" | "success"; text: string }>();

  const canSubmit =
    title.trim().length >= 3 &&
    location.trim().length >= 2 &&
    description.trim().length >= 5 &&
    !submitting;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    setMsg(undefined);

    try {
      const id = await createPTW({
        title: title.trim(),
        location: location.trim(),
        description: description.trim(),
        // kalau createPTW sudah default "Submitted",
        // field `status` bisa diabaikan. Kalau ingin pakai:
        status,
      } as any);

      setMsg({ type: "success", text: "PTW berhasil dibuat." });
      // beri sedikit jeda supaya user melihat pesan
      setTimeout(() => router.push("/ptw"), 400);
    } catch (err: any) {
      console.error(err);
      setMsg({
        type: "error",
        text:
          err?.message ??
          "Gagal mengirim PTW. Cek koneksi & izin, lalu coba lagi.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-semibold mb-4">Permit to Work – Form Baru</h1>

      {msg && (
        <div
          className={`mb-4 rounded px-3 py-2 text-sm ${
            msg.type === "error"
              ? "bg-red-50 text-red-700 border border-red-200"
              : "bg-emerald-50 text-emerald-700 border border-emerald-200"
          }`}
        >
          {msg.text}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Judul Pekerjaan</label>
          <input
            type="text"
            className="w-full rounded border border-zinc-300 px-3 py-2 outline-none focus:ring-2 focus:ring-black/20"
            placeholder="Contoh: Maintenance HAO"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={120}
            required
          />
          <p className="text-xs text-zinc-500 mt-1">
            Minimal 3 karakter. Maks 120.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Lokasi</label>
          <input
            type="text"
            className="w-full rounded border border-zinc-300 px-3 py-2 outline-none focus:ring-2 focus:ring-black/20"
            placeholder="Contoh: Winding Hall B"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            maxLength={120}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Deskripsi Pekerjaan</label>
          <textarea
            className="w-full rounded border border-zinc-300 px-3 py-2 outline-none focus:ring-2 focus:ring-black/20 min-h-[120px]"
            placeholder="Uraikan pekerjaan, ruang lingkup, dan catatan penting."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={2000}
            required
          />
          <p className="text-xs text-zinc-500 mt-1">
            Minimal 5 karakter. Sertakan konteks yang cukup.
          </p>
        </div>

        {/* Opsional: pilih status awal */}
        <div>
          <label className="block text-sm font-medium mb-1">Status Awal</label>
          <select
            className="w-full rounded border border-zinc-300 px-3 py-2 outline-none focus:ring-2 focus:ring-black/20 bg-white"
            value={status}
            onChange={(e) => setStatus(e.target.value as PTWStatus)}
          >
            <option value="Submitted">Submitted</option>
            <option value="Draft">Draft</option>
          </select>
          <p className="text-xs text-zinc-500 mt-1">
            Umumnya gunakan <b>Submitted</b>. Draft untuk menyimpan sementara.
          </p>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={!canSubmit}
            className={`px-4 py-2 rounded text-white ${
              canSubmit ? "bg-black hover:opacity-90" : "bg-zinc-400"
            }`}
          >
            {submitting ? "Mengirim…" : "Submit PTW"}
          </button>

          <button
            type="button"
            onClick={() => router.push("/ptw")}
            className="px-4 py-2 rounded border border-zinc-300 hover:bg-zinc-50"
          >
            Batal
          </button>
        </div>
      </form>
    </div>
  );
}