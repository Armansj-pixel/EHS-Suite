"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { db } from "@/lib/firestore";
import { doc, getDoc } from "firebase/firestore";

type Profile = {
  uid: string;
  name?: string;
  email?: string;
  role?: string;
  photoURL?: string;
};

export default function DashboardClient() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    const u = auth.currentUser;
    if (!u) return;

    // Ambil profil dari koleksi "users/{uid}" (jika ada), kalau tidak ada gunakan data auth.
    (async () => {
      try {
        const ref = doc(db, "users", u.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data() as Partial<Profile>;
          setProfile({
            uid: u.uid,
            name: data.name || u.displayName || u.email || "User",
            email: data.email || u.email || "",
            role: data.role || "staff",
            photoURL: data.photoURL || u.photoURL || undefined,
          });
        } else {
          setProfile({
            uid: u.uid,
            name: u.displayName || u.email || "User",
            email: u.email || "",
            role: "staff",
            photoURL: u.photoURL || undefined,
          });
        }
      } catch {
        setProfile({
          uid: u.uid,
          name: u.displayName || u.email || "User",
          email: u.email || "",
          role: "staff",
          photoURL: u.photoURL || undefined,
        });
      }
    })();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar */}
      <header className="flex items-center justify-between bg-white shadow px-6 py-3">
        <h1 className="text-lg font-semibold text-gray-800">EHS Suite Dashboard</h1>
        <div className="flex items-center gap-3">
          <img
            alt="avatar"
            className="w-8 h-8 rounded-full border"
            src={
              profile?.photoURL ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                profile?.name || "User"
              )}&background=0D8ABC&color=fff`
            }
          />
          <div className="text-right">
            <div className="text-sm font-medium text-gray-700">
              {profile?.name || "User"}
            </div>
            <div className="text-xs text-gray-500">
              {profile?.role ? profile.role.toUpperCase() : "USER"}
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="ml-2 px-3 py-1 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Menu Cards */}
      <main className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Hazard */}
        <Link
          href="/hazard"
          className="bg-white shadow rounded-lg p-6 hover:shadow-lg transition"
        >
          <h2 className="text-xl font-semibold text-green-700 mb-2">⚠️ Hazard Report</h2>
          <p className="text-gray-500 text-sm">
            Laporkan potensi bahaya di area kerja untuk mencegah insiden.
          </p>
        </Link>

        {/* Near Miss */}
        <Link
          href="/nearmiss"
          className="bg-white shadow rounded-lg p-6 hover:shadow-lg transition"
        >
          <h2 className="text-xl font-semibold text-yellow-600 mb-2">⚡ Near Miss</h2>
          <p className="text-gray-500 text-sm">
            Catat kejadian nyaris celaka sebelum menjadi insiden serius.
          </p>
        </Link>

        {/* Inspections */}
        <Link
          href="/inspections"
          className="bg-white shadow rounded-lg p-6 hover:shadow-lg transition"
        >
          <h2 className="text-xl font-semibold text-blue-600 mb-2">🔍 Inspeksi</h2>
          <p className="text-gray-500 text-sm">
            Catat temuan inspeksi area, APD, alat angkut, housekeeping, dll.
          </p>
        </Link>

        {/* KPI */}
        <Link
          href="/dashboard/kpi"
          className="bg-white shadow rounded-lg p-6 hover:shadow-lg transition"
        >
          <h2 className="text-xl font-semibold text-indigo-600 mb-2">📊 KPI Dashboard</h2>
          <p className="text-gray-500 text-sm">
            Pantau performa keselamatan melalui KPI otomatis dari laporan EHS.
          </p>
        </Link>

        {/* PTW */}
        <Link
          href="/ptw"
          className="bg-white shadow rounded-lg p-6 hover:shadow-lg transition"
        >
          <h2 className="text-xl font-semibold text-red-600 mb-2">🧾 Permit To Work (PTW)</h2>
          <p className="text-gray-500 text-sm">
            Ajukan dan kelola izin kerja berisiko: Hot Work, Electrical, Confined Space, dsb.
          </p>
        </Link>

        {/* HIRARC */}
        <Link
          href="/hirarc"
          className="bg-white shadow rounded-lg p-6 hover:shadow-lg transition"
        >
          <h2 className="text-xl font-semibold text-gray-700 mb-2">🧠 HIRARC</h2>
          <p className="text-gray-500 text-sm">
            Kelola Hazard Identification, Risk Assessment, and Risk Control.
          </p>
        </Link>
      </main>
    </div>
  );
}