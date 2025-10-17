"use client";
import AuthGate from "@/components/AuthGate";
import { useUserProfile } from "@/lib/useUserProfile";

export default function ProfilePage() {
  const { ready, uid, profile, error } = useUserProfile();
  return (
    <AuthGate>
      <div className="p-6 space-y-2">
        <h1 className="text-2xl font-bold">My Profile</h1>
        {!ready && <p>Loading...</p>}
        {error && <p className="text-red-600 text-sm">{error}</p>}
        {profile && (
          <ul className="text-sm">
            <li><b>UID:</b> {uid}</li>
            <li><b>Name:</b> {profile.name || "-"}</li>
            <li><b>Email:</b> {profile.email || "-"}</li>
            <li><b>Role:</b> {profile.role}</li>
            <li><b>Dept:</b> {profile.dept || "-"}</li>
            <li><b>Active:</b> {String(profile.active ?? true)}</li>
          </ul>
        )}
      </div>
    </AuthGate>
  );
}