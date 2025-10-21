// app/ptw/new/PTWForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createPTW } from "@/lib/ptw";

export default function PTWForm() {
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !location.trim() || !description.trim()) {
      alert("Lengkapi judul, lokasi, dan deskripsi.");
      return;
    }
    try {
      setSubmitting(true);
      const id = await createPTW({ title, location, description });
      // opsional: toast sukses
      alert("PTW terkirim (Submitted).");
      router.push(`/ptw`); // arahkan ke daftar PTW
    } catch (err: any) {
      console.error(err);
      alert(`Gagal mengirim PTW. ${err?.message ?? "Cek koneksi & izin."}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-xl mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-semibold">Permit to Work — Form Baru</h1>

      <input
        className="w-full border rounded-lg px-3 py-2"
        placeholder="Judul pekerjaan"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <input
        className="w-full border rounded-lg px-3 py-2"
        placeholder="Lokasi"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
      />

      <textarea
        className="w-full border rounded-lg px-3 py-2 min-h-[140px]"
        placeholder="Deskripsi pekerjaan / risiko singkat"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 rounded-lg bg-black text-white disabled:opacity-60"
        >
          {submitting ? "Mengirim…" : "Submit"}
        </button>
        <button
          type="button"
          onClick={() => history.back()}
          className="px-4 py-2 rounded-lg border"
        >
          Batal
        </button>
      </div>
    </form>
  );
}