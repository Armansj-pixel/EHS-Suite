"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";

type UserMini = { name: string; email: string; role?: string };

export default function DashboardClient() {
  const [me, setMe] = useState<UserMini | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) return setMe(null);
      // nama dari profile/users bisa ditambahkan nanti; sementara pakai displayName/email
      setMe({
        name: u.displayName || "User",
        email: u.email || "",
      });
    });
    return () => unsub();
  }, []);

  const initials =
    me?.name
      ?.split(" ")
      .map((s) => s[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U";

  return (
    <div className="mx-auto max-w-6xl p-4 md:p-6">
      {/* Top bar */}
      <div className="mb-4 flex items-center justify-between rounded-xl border bg-white px-4 py-3 shadow-sm">
        <h1 className="text-xl font-semibold">EHS Suite Dashboard</h1>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 font-semibold">
              {initials}
            </div>
            <div className="hidden text-right md:block">
              <div className="text-sm font-medium leading-tight">{me?.name}</div>
              <div className="text-xs text-slate-500">{me?.email}</div>
            </div>
          </div>
          <button
            onClick={() => signOut(auth)}
            className="rounded-lg bg-rose-600 px-3 py-2 text-sm font-medium text-white hover:bg-rose-700"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Quick actions (pad & spacing konsisten) */}
      <div className="grid gap-4 md:grid-cols-2">
        <DashCard
          title="Hazard"
          desc="Buat laporan hazard"
          href="/hazards/new"
        />
        <DashCard
          title="Near Miss"
          desc="Catat kejadian hampir celaka"
          href="/nearmiss/new"
        />
        <DashCard
          title="Inspeksi"
          desc="Checklist & rekap inspeksi"
          href="/inspections"
        />
        <DashCard
          title="Daftar Hazard"
          desc="Lihat & tutup tiket"
          href="/hazards"
        />
        {/* Permit to Work (opsional; tampil kalau rute tersedia) */}
        <DashCard
          title="Permit to Work"
          desc="Ajukan & kelola izin kerja"
          href="/ptw"
        />
      </div>

      {/* KPI Panel (tetap di dashboard) */}
      <section className="mt-6 rounded-xl border bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold">Dashboard KPI</h2>
        {/* Komponen/isi KPI kamu di sini.
            Jika kamu sudah punya <KpiPanel /> tinggal panggil:
            <KpiPanel />
        */}
        <p className="text-sm text-slate-500">
          KPI dihitung dari koleksi <code>hazard_reports</code> dan{" "}
          <code>inspections</code>. Pastikan setiap dokumen punya field{" "}
          <code>createdAt</code> (Timestamp) & <code>createdBy</code>.
        </p>
      </section>
    </div>
  );
}

function DashCard({
  title,
  desc,
  href,
}: {
  title: string;
  desc: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="block rounded-xl border bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="text-base font-semibold">{title}</div>
      <div className="mt-1 text-sm text-slate-600">{desc}</div>
    </Link>
  );
}