"use client";

import { useEffect, useRef, useState } from "react";
import { getAuth, signOut, sendPasswordResetEmail } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function TopBar() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; email: string; photo?: string } | null>(null);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Ambil info user dari Firebase Auth
  useEffect(() => {
    const auth = getAuth();
    const u = auth.currentUser;
    if (u) {
      setUser({
        name: u.displayName ?? "User",
        email: u.email ?? "",
        photo: u.photoURL ?? "",
      });
    }
  }, []);

  // Tutup dropdown saat klik di luar
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const handleLogout = async () => {
    const auth = getAuth();
    await signOut(auth);
    router.push("/login");
  };

  const handleProfile = () => {
    // arahkan ke halaman profil (pastikan /app/profile/page.tsx ada)
    router.push("/profile");
  };

  const handleChangePassword = async () => {
    try {
      const auth = getAuth();
      const email = auth.currentUser?.email;
      if (!email) {
        alert("Akun ini tidak memiliki email login.");
        return;
      }
      await sendPasswordResetEmail(auth, email);
      alert(`Link reset password telah dikirim ke: ${email}`);
    } catch (e: any) {
      console.error(e);
      alert(e?.message ?? "Gagal mengirim link reset password.");
    } finally {
      setOpen(false);
    }
  };

  const initials =
    user?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() ?? "U";

  return (
    <header className="w-full bg-white border-b shadow-sm px-4 py-2 flex items-center justify-between sticky top-0 z-50">
      <h1 className="font-semibold text-lg text-gray-800 tracking-tight">EHS Suite Dashboard</h1>

      <div className="flex items-center gap-4">
        {/* Info ringkas user (optional, tetap tampil di kanan) */}
        {user && (
          <div className="hidden sm:flex flex-col items-end leading-tight">
            <span className="text-sm font-medium text-gray-800">{user.name}</span>
            <span className="text-xs text-gray-500">{user.email}</span>
          </div>
        )}

        {/* Avatar + Dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setOpen((s) => !s)}
            className="flex items-center gap-2 px-2 py-1.5 rounded-md border hover:bg-gray-50"
            aria-haspopup="menu"
            aria-expanded={open}
          >
            {user?.photo ? (
              <img
                src={user.photo}
                alt="avatar"
                className="w-8 h-8 rounded-full border border-gray-300 object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gray-800 text-white flex items-center justify-center font-semibold text-sm">
                {initials}
              </div>
            )}
            <svg
              className={`w-4 h-4 text-gray-600 transition ${open ? "rotate-180" : ""}`}
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M5.23 7.21a.75.75 0 011.06.02L10 11.167l3.71-3.936a.75.75 0 111.08 1.04l-4.24 4.5a.75.75 0 01-1.08 0l-4.24-4.5a.75.75 0 01.02-1.06z"
                clipRule="evenodd"
              />
            </svg>
          </button>

          {/* Menu */}
          {open && (
            <div
              role="menu"
              aria-label="User menu"
              className="absolute right-0 mt-2 w-56 rounded-lg border bg-white shadow-lg overflow-hidden"
            >
              <button
                onClick={handleProfile}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                role="menuitem"
              >
                Profil
              </button>
              <button
                onClick={handleChangePassword}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                role="menuitem"
              >
                Ganti Password (email)
              </button>
              <div className="my-1 border-t" />
              <button
                onClick={handleLogout}
                className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                role="menuitem"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}