import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export type Role = "owner" | "ehs_manager" | "supervisor" | "staff" | "contractor";
export type UserProfile = {
  uid: string;
  name?: string;
  email?: string;
  role: Role;
  dept?: string;
  active?: boolean;
};

export async function getCurrentUserProfile(): Promise<UserProfile | null> {
  return new Promise((resolve) => {
    onAuthStateChanged(auth, async (user: User | null) => {
      if (!user) return resolve(null);

      const ref = doc(db, "users", user.uid);
      const snap = await getDoc(ref);

      if (!snap.exists()) {
        // default role jika dokumen user belum ada
        return resolve({
          uid: user.uid,
          email: user.email || "",
          role: "staff",
        });
      }

      // Hapus uid dari data Firestore agar tidak duplikat saat merge
      const raw = snap.data() as Partial<UserProfile>;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { uid: _discard, ...rest } = raw;

      return resolve({
        uid: user.uid,            // sumber kebenaran uid = dari Auth
        email: user.email || rest.email,
        role: (rest.role as Role) ?? "staff",
        name: rest.name,
        dept: rest.dept,
        active: rest.active,
      });
    });
  });
}

export function hasRole(user: UserProfile | null, allowed: Role[]): boolean {
  if (!user) return false;
  return allowed.includes(user.role);
}

export function redirectIfUnauthorized(user: UserProfile | null, allowed: Role[]) {
  if (!user) {
    window.location.href = "/(auth)/login";
    return;
  }
  if (!allowed.includes(user.role)) {
    alert("Akses ditolak: Anda tidak memiliki izin untuk halaman ini.");
    window.location.href = "/";
  }
}