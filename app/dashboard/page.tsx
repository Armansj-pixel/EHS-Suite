"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useUserProfile } from "@/lib/useUserProfile";
import DashboardClient from "./DashboardClient";

export default function DashboardPage() {
  const { profile, ready } = useUserProfile();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleLogout() {
    await signOut(auth);
    router.push("/login");
  }

  // ✅ Avatar fallback: pakai Auth.photoURL jika ada, kalau tidak gunakan UI Avatars
  const avatarUrl =
    auth.currentUser?.photoURL ||
    ("https://ui-avatars.com/api/?name=" +
      encodeURIComponent(profile?.name || "User") +
      "&background=0D8ABC&color=fff");

  return (
    <div className="space-y-6">
      {/* === Top Bar === */}
      <div className="bg-white border rounded-xl px-4 py-3 flex items-center justify-between relative">
        <h1 className="text-xl font-semibold">EHS Suite Dashboard</h1>

        {/* Profil dropdown */}
        <div className="relative">
          {ready ? (
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2 focus:outline-none"
            >
              <img
                src={avatarUrl}
                alt="Profile"
                className="w-9 h-9 rounded-full border"
              />
              <div className="hidden md:block text-left">
                <div className="text-sm font-medium">
                  {profile?.name || "User"}
                </div>
                <div className="text-xs text-gray-500">
                  {profile?.role || "User"}
                </div>
              </div>
            </button>
          ) : (
            <div className="text-sm text-gray-400">Loading user...</div>
          )}

          {/* Dropdown Menu */}
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-44 bg-white border rounded-lg shadow-md z-10">
              <Link
                href="/profile"
                className="block px-4 py-2 text-sm hover:bg-gray-50"
                onClick={() => setMenuOpen(false)}
              >
                Profil Saya
              </Link>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>

      {/* === Pintasan fitur utama === */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Link
          href="/hazards/new"
          className="bg-white border rounded-xl p-4 hover:bg-gray-50 transition"
        >
          <div className="text-sm font-medium">+ Hazard</div>
          <div className="text-xs text-gray-500">Buat laporan hazard</div>
        </Link>

        <Link
          href="/nearmiss/new"
          className="bg-white border rounded-xl p-4 hover:bg-gray-50 transition"
        >
          <div className="text-sm font-medium">+ Near Miss</div>
          <div className="text-xs text-gray-500">
            Catat kejadian hampir celaka
          </div>
        </Link>

        <Link
          href="/inspections"
          className="bg-white border rounded-xl p-4 hover:bg-gray-50 transition"
        >
          <div className="text-sm font-medium">Inspeksi</div>
          <div className="text-xs text-gray-500">Checklist & rekap inspeksi</div>
        </Link>

        <Link
          href="/hazards"
          className="bg-white border rounded-xl p-4 hover:bg-gray-50 transition"
        >
          <div className="text-sm font-medium">Daftar Hazard</div>
          <div className="text-xs text-gray-500">Lihat & tutup tiket</div>
        </Link>
      </div>

      {/* === Dashboard KPI === */}
      <div className="bg-white border rounded-xl p-4">
        <h2 className="text-lg font-semibold mb-3">Dashboard KPI</h2>
        <DashboardClient />
      </div>

      {/* === Catatan bawah === */}
      <div className="text-xs text-gray-500">
        Catatan: KPI dihitung langsung di browser (client-side) menggunakan akun
        login aktif agar sesuai dengan Firestore Rules. Jika data belum muncul,
        pastikan koleksi <code>hazard_reports</code> dan{" "}
        <code>inspections</code> memiliki field <code>createdAt</code>.
      </div>
    </div>
  );
}