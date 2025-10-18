"use client";

import { getAuth, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function TopBar() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; email: string; photo?: string } | null>(null);

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

  const handleLogout = async () => {
    const auth = getAuth();
    await signOut(auth);
    router.push("/login");
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
        {/* Info User */}
        {user && (
          <div className="flex items-center gap-2">
            {user.photo ? (
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
            <div className="text-sm leading-tight">
              <div className="font-medium text-gray-800">{user.name}</div>
              <div className="text-gray-500 text-xs">{user.email}</div>
            </div>
          </div>
        )}

        {/* Tombol Logout */}
        <button
          onClick={handleLogout}
          className="text-sm px-3 py-1.5 rounded bg-gray-800 text-white hover:bg-gray-700 transition"
        >
          Logout
        </button>
      </div>
    </header>
  );
}