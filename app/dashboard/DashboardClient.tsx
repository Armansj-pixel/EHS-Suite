"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getUserProfile } from "@/lib/users";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function DashboardClient() {
  const [profile, setProfile] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      getUserProfile(user.uid).then(setProfile);
    }
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 🔹 Top Bar */}
      <header className="flex items-center justify-between bg-white shadow px-6 py-3">
        <h1 className="text-lg font-semibold text-gray-700">
          EHS Suite Dashboard
        </h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">
            {profile?.name || "User"}
          </span>
          <button
            onClick={handleLogout}
            className="px-3 py-1 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600"
          >
            Logout
          </button>
        </div>
      </header>

      {/* 🔹 Main Menu Cards */}
      <main className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Hazard Report */}
        <Link
          href="/hazard"
          className="bg-white shadow rounded-lg p-6 hover:shadow-lg transition"
        >
          <h2 className="text-xl font-semibold text-green-700 mb-2">
            ⚠️ Hazard Report
          </h2>
          <p className="text-gray-500 text-sm">
            Laporkan potensi bahaya di area kerja untuk mencegah kecelakaan.
          </p>
        </Link>

        {/* Near Miss */}
        <Link
          href="/nearmiss"
          className="bg-white shadow rounded-lg p-6 hover:shadow-lg transition"
        >
          <h2 className="text-xl font-semibold text-yellow-600 mb-2">
            ⚡ Near Miss
          </h2>
          <p className="text-gray-500 text-sm">
            Laporkan kejadian nyaris celaka sebelum menjadi insiden serius.
          </p>
        </Link>

        {/* Inspection */}
        <Link
          href="/inspections"
          className="bg-white shadow rounded-lg p-6 hover:shadow-lg transition"
        >
          <h2 className="text-xl font-semibold text-blue-600 mb-2">
            🔍 Inspeksi
          </h2>
          <p className="text-gray-500 text-sm">
            Catat temuan dari hasil inspeksi area kerja, APD, atau alat angkut.
          </p>
        </Link>

        {/* KPI Summary */}
        <Link
          href="/dashboard/kpi"
          className="bg-white shadow rounded-lg p-6 hover:shadow-lg transition"
        >
          <h2 className="text-xl font-semibold text-indigo-600 mb-2">
            📊 KPI Dashboard
          </h2>
          <p className="text-gray-500 text-sm">
            Pantau performa keselamatan melalui KPI otomatis dari laporan EHS.
          </p>
        </Link>

        {/* Permit To Work */}
        <Link
          href="/ptw"
          className="bg-white shadow rounded-lg p-6 hover:shadow-lg transition"
        >
          <h2 className="text-xl font-semibold text-red-600 mb-2">
            🧾 Permit To Work (PTW)
          </h2>
          <p className="text-gray-500 text-sm">
            Ajukan, pantau, dan kelola izin kerja berisiko seperti Hot Work,
            Electrical, dan lainnya.
          </p>
        </Link>

        {/* HIRARC */}
        <Link
          href="/hirarc"
          className="bg-white shadow rounded-lg p-6 hover:shadow-lg transition"
        >
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            🧠 HIRARC
          </h2>
          <p className="text-gray-500 text-sm">
            Kelola data Hazard Identification, Risk Assessment, and Control.
          </p>
        </Link>
      </main>
    </div>
  );
}