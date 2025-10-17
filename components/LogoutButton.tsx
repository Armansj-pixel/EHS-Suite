"use client";

import { getAuth, signOut } from "firebase/auth";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogout() {
    try {
      setLoading(true);
      await signOut(getAuth());       // Firebase sign out
      router.replace("/login");       // kembali ke login
    } catch (e) {
      console.error("Logout failed:", e);
      alert("Gagal logout. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="text-sm px-3 py-1 rounded border hover:bg-gray-50"
    >
      {loading ? "Keluar..." : "Logout"}
    </button>
  );
}