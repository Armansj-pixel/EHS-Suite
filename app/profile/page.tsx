"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { getAuth, updateProfile } from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";

type UserProfile = {
  uid: string;
  name: string;
  email: string;
  phone?: string;
  department?: string;
  role?: string; // e.g. "ehs_manager", "safety_officer", "viewer"
  photoURL?: string;
  updatedAt?: any;
  createdAt?: any;
};

export default function ProfilePage() {
  const auth = getAuth();
  const storage = getStorage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [ready, setReady] = useState(false);
  const [uid, setUid] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [photoURL, setPhotoURL] = useState<string>("");
  const [initialPhotoURL, setInitialPhotoURL] = useState<string>("");

  const [name, setName] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [department, setDepartment] = useState<string>("");
  const [role, setRole] = useState<string>(""); // readonly di UI
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Load current user & profile document
  useEffect(() => {
    const u = auth.currentUser;
    if (!u) return;

    setUid(u.uid);
    setEmail(u.email ?? "");
    setPhotoURL(u.photoURL ?? "");
    setInitialPhotoURL(u.photoURL ?? "");
    setName(u.displayName ?? "");

    (async () => {
      try {
        const ref = doc(db, "users", u.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const p = snap.data() as UserProfile;
          setName(p.name || u.displayName || "");
          setPhone(p.phone || "");
          setDepartment(p.department || "");
          setRole(p.role || "");
          if (p.photoURL) {
            setPhotoURL(p.photoURL);
            setInitialPhotoURL(p.photoURL);
          }
        } else {
          // inisialisasi dokumen user pertama kali
          const init: UserProfile = {
            uid: u.uid,
            name: u.displayName || "User",
            email: u.email || "",
            role: "viewer",
            phone: "",
            department: "",
            photoURL: u.photoURL || "",
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };
          await setDoc(ref, init, { merge: true });
          setRole(init.role!);
        }
      } catch (e: any) {
        console.error(e);
        setError(e?.message ?? "Gagal memuat profil.");
      } finally {
        setReady(true);
      }
    })();
  }, [auth]);

  const onPickImage = () => fileInputRef.current?.click();

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uid) return;

    try {
      setSaving(true);
      setMessage(null);
      setError(null);

      const ref = storageRef(storage, `avatars/${uid}.jpg`);
      await uploadBytes(ref, file);
      const url = await getDownloadURL(ref);
      setPhotoURL(url);
      setMessage("Foto diunggah. Jangan lupa klik Simpan.");
    } catch (e: any) {
      console.error(e);
      setError(e?.message ?? "Gagal mengunggah foto.");
    } finally {
      setSaving(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const onSave = async () => {
    if (!uid) return;
    try {
      setSaving(true);
      setMessage(null);
      setError(null);

      // Update Firestore
      const ref = doc(db, "users", uid);
      await updateDoc(ref, {
        name: name || "",
        phone: phone || "",
        department: department || "",
        role: role || "viewer",
        photoURL: photoURL || "",
        updatedAt: serverTimestamp(),
      });

      // Sync ke Firebase Auth jika ada perubahan nama/foto
      const u = auth.currentUser;
      if (u && (name !== (u.displayName ?? "") || photoURL !== (u.photoURL ?? ""))) {
        await updateProfile(u, {
          displayName: name || undefined,
          photoURL: photoURL || undefined,
        });
      }

      setInitialPhotoURL(photoURL);
      setMessage("Profil berhasil disimpan.");
    } catch (e: any) {
      console.error(e);
      setError(e?.message ?? "Gagal menyimpan profil.");
    } finally {
      setSaving(false);
    }
  };

  if (!auth.currentUser) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold mb-2">My Profile</h1>
        <p className="text-sm text-gray-600 mb-4">
          Anda belum login.
        </p>
        <Link
          href="/login"
          className="inline-block px-3 py-1.5 rounded bg-gray-900 text-white text-sm"
        >
          Ke Halaman Login
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-xl font-semibold">My Profile</h1>
      <p className="text-xs text-gray-500 mb-4">Kelola informasi akun Anda.</p>

      {error && <div className="text-sm text-red-600 mb-3">⚠️ {error}</div>}
      {message && <div className="text-sm text-emerald-700 mb-3">✓ {message}</div>}

      {!ready ? (
        <div className="text-sm text-gray-500">Memuat profil…</div>
      ) : (
        <div className="bg-white border rounded-xl p-4 space-y-6">
          {/* Foto & Upload */}
          <div className="flex items-center gap-4">
            {photoURL ? (
              <img
                src={photoURL}
                alt="avatar"
                className="w-16 h-16 rounded-full border object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gray-800 text-white flex items-center justify-center text-lg font-semibold">
                {(name || "U")
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()}
              </div>
            )}
            <div className="flex gap-2">
              <button
                onClick={onPickImage}
                className="px-3 py-1.5 border rounded text-sm hover:bg-gray-50"
                disabled={saving}
              >
                Unggah Foto
              </button>
              {photoURL && photoURL !== initialPhotoURL && (
                <span className="text-xs text-amber-600 self-center">
                  Perubahan foto belum disimpan.
                </span>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onFileChange}
            />
          </div>

          {/* Form fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600">Nama Lengkap</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full border rounded px-3 py-2 text-sm"
                placeholder="Nama Lengkap"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600">Email</label>
              <input
                value={email}
                readOnly
                className="mt-1 w-full border rounded px-3 py-2 text-sm bg-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600">Telepon</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1 w-full border rounded px-3 py-2 text-sm"
                placeholder="08xx…"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600">Departemen</label>
              <input
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="mt-1 w-full border rounded px-3 py-2 text-sm"
                placeholder="EHS / Produksi / QA …"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600">Role (baca-saja)</label>
              <input
                value={role}
                readOnly
                className="mt-1 w-full border rounded px-3 py-2 text-sm bg-gray-100"
                placeholder="viewer"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600">User ID</label>
              <input
                value={uid}
                readOnly
                className="mt-1 w-full border rounded px-3 py-2 text-sm bg-gray-100"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={onSave}
              disabled={saving}
              className="px-4 py-2 rounded bg-gray-900 text-white text-sm hover:bg-gray-800 disabled:opacity-60"
            >
              {saving ? "Menyimpan…" : "Simpan"}
            </button>
            <Link
              href="/dashboard"
              className="px-4 py-2 rounded border text-sm hover:bg-gray-50"
            >
              Kembali ke Dashboard
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}