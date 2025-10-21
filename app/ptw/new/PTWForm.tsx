"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createPTW, PTW } from "@/lib/ptw";
import { auth } from "@/lib/firebase";

export default function PTWForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    location: "",
    description: "",
    startDate: "",
    endDate: "",
  });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Not authenticated");

      const payload: PTW = {
        title: form.title.trim(),
        location: form.location.trim(),
        description: form.description.trim(),
        requesterUid: user.uid,
        startDate: new Date(form.startDate),
        endDate: new Date(form.endDate),
        status: "Submitted",
      };
      const id = await createPTW(payload);
      router.push(`/ptw/${id}`);
    } catch (err) {
      console.error(err);
      alert("Gagal mengirim PTW. Cek koneksi & izin.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 max-w-xl">
      <input required placeholder="Judul pekerjaan"
        className="w-full border rounded p-2"
        value={form.title}
        onChange={e => setForm(s => ({ ...s, title: e.target.value }))} />
      <input required placeholder="Lokasi"
        className="w-full border rounded p-2"
        value={form.location}
        onChange={e => setForm(s => ({ ...s, location: e.target.value }))} />
      <textarea required placeholder="Deskripsi singkat"
        className="w-full border rounded p-2"
        rows={4}
        value={form.description}
        onChange={e => setForm(s => ({ ...s, description: e.target.value }))} />
      <div className="grid grid-cols-2 gap-3">
        <input required type="date" className="border rounded p-2"
          value={form.startDate}
          onChange={e => setForm(s => ({ ...s, startDate: e.target.value }))} />
        <input required type="date" className="border rounded p-2"
          value={form.endDate}
          onChange={e => setForm(s => ({ ...s, endDate: e.target.value }))} />
      </div>
      <button type="submit" disabled={loading}
        className="px-4 py-2 rounded bg-black text-white disabled:opacity-50">
        {loading ? "Mengirim..." : "Submit PTW"}
      </button>
    </form>
  );
}