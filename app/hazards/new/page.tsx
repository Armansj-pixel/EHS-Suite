"use client";
import { useState } from "react";
import { db } from "@/lib/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function NewHazardPage() {
  const [title, setTitle] = useState("");
  const [description, setDesc] = useState("");
  const [status, setStatus] = useState<"Open"|"Closed">("Open");
  const router = useRouter();

  async function submit() {
    await addDoc(collection(db, "hazard_reports"), {
      title, description, status,
      type: "Hazard",
      createdAt: serverTimestamp(),
    });
    router.push("/hazards");
  }

  return (
    <div className="space-y-4 max-w-xl">
      <h1 className="text-xl font-semibold">Laporkan Hazard</h1>
      <input className="border rounded px-3 py-2 w-full" placeholder="Judul"
        value={title} onChange={(e)=>setTitle(e.target.value)} />
      <textarea className="border rounded px-3 py-2 w-full" placeholder="Deskripsi"
        value={description} onChange={(e)=>setDesc(e.target.value)} />
      <select className="border rounded px-3 py-2" value={status} onChange={(e)=>setStatus(e.target.value as any)}>
        <option>Open</option><option>Closed</option>
      </select>
      <div className="flex gap-2">
        <button onClick={submit} className="px-4 py-2 bg-gray-900 text-white rounded text-sm">Simpan</button>
        <a href="/hazards" className="px-4 py-2 border rounded text-sm">Batal</a>
      </div>
    </div>
  );
}