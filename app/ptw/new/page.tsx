"use client";

import { useEffect, useState } from "react";
import { Timestamp } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";
import { createPTW } from "@/lib/ptw";
import { useRouter } from "next/navigation";
import AuthGate from "@/components/AuthGate";

const PTW_TYPES = ["Hot Work", "Electrical", "Confined Space", "Lifting", "Working at Height"];

export default function PTWNewPage() {
  const [user] = useAuthState(auth);
  const router = useRouter();

  const [type, setType] = useState(PTW_TYPES[0]);
  const [area, setArea] = useState("");
  const [locationDetail, setLocationDetail] = useState("");
  const [job, setJob] = useState("");
  const [start, setStart] = useState<string>("");
  const [end, setEnd] = useState<string>("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    if (!type || !area || !job || !start || !end) {
      alert("Isi semua field wajib.");
      return;
    }
    const startTs = Timestamp.fromDate(new Date(start));
    const endTs = Timestamp.fromDate(new Date(end));
    if (startTs.toMillis() >= endTs.toMillis()) {
      alert("Waktu mulai harus < waktu selesai.");
      return;
    }

    const id = await createPTW({
      type,
      area,
      locationDetail,
      jobDescription: job,
      requesterUid: user.uid,
      requesterName: user.displayName ?? user.email ?? "User",
      startPlanned: startTs,
      endPlanned: endTs,
      createdBy: user.uid,
      // opsional:
      approvals: [],
      controls: { fireWatch: false, gasTest: { required: false } as any },
      extension: { count: 0, history: [] },
      hirarcRef: null,
    } as any);

    router.replace(`/ptw/${id}`);
  }

  return (
    <AuthGate>
      <div className="max-w-3xl mx-auto p-4">
        <h1 className="text-xl font-semibold mb-4">Buat PTW</h1>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Jenis Pekerjaan</label>
            <select className="border p-2 w-full" value={type} onChange={e => setType(e.target.value)}>
              {PTW_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">Area</label>
            <input className="border p-2 w-full" value={area} onChange={e => setArea(e.target.value)} placeholder="Winding - Line 3" />
          </div>
          <div>
            <label className="block text-sm mb-1">Lokasi Detail</label>
            <input className="border p-2 w-full" value={locationDetail} onChange={e => setLocationDetail(e.target.value)} placeholder="Bay 3, dekat oven" />
          </div>
          <div>
            <label className="block text-sm mb-1">Deskripsi Pekerjaan</label>
            <textarea className="border p-2 w-full" rows={3} value={job} onChange={e => setJob(e.target.value)} placeholder="Pengelasan bracket support" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1">Mulai (rencana)</label>
              <input type="datetime-local" className="border p-2 w-full" value={start} onChange={e => setStart(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm mb-1">Selesai (rencana)</label>
              <input type="datetime-local" className="border p-2 w-full" value={end} onChange={e => setEnd(e.target.value)} />
            </div>
          </div>
          <div className="pt-2 flex gap-2">
            <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700" type="submit">Submit</button>
          </div>
        </form>
      </div>
    </AuthGate>
  );
}