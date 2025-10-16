// ============================================ // EHS Suite – Firebase Starter (Next.js + TS) // Using the config you provided (client-side only) // ============================================

// 1) lib/firebase.ts // ------------------- // Drop this file at /lib/firebase.ts

import { initializeApp, getApps, getApp } from "firebase/app"; import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth"; import { getFirestore } from "firebase/firestore"; import { getStorage } from "firebase/storage"; // Analytics is browser-only; guard SSR let analytics: any = null;

const firebaseConfig = { apiKey: "AIzaSyDoFgYKHbiKXonkPh7zgKYwaFM2cp_-2WI", authDomain: "ehs-suite-fedff.firebaseapp.com", projectId: "ehs-suite-fedff", // NOTE: if Storage fails to init, try switching to "ehs-suite-fedff.appspot.com" storageBucket: "ehs-suite-fedff.firebasestorage.app", messagingSenderId: "953205445535", appId: "1:953205445535:web:9b43938d0749ceaf9263aa", measurementId: "G-XBNMD978W0" };

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const auth = getAuth(app); setPersistence(auth, browserLocalPersistence);

const db = getFirestore(app); const storage = getStorage(app);

if (typeof window !== "undefined") { import("firebase/analytics").then(({ getAnalytics }) => { try { analytics = getAnalytics(app); } catch {} }); }

export { app, auth, db, storage, analytics };

// 2) app/(auth)/login/page.tsx // ---------------------------- // Minimal email/password login page for Next.js App Router

"use client"; import { useState } from "react"; import { auth } from "@/lib/firebase"; import { signInWithEmailAndPassword } from "firebase/auth"; import Link from "next/link";

export default function LoginPage() { const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [loading, setLoading] = useState(false); const [error, setError] = useState<string | null>(null);

async function onSubmit(e: React.FormEvent) { e.preventDefault(); setLoading(true); setError(null); try { await signInWithEmailAndPassword(auth, email.trim(), password); window.location.href = "/"; // redirect to dashboard } catch (err: any) { setError(err?.message ?? "Login failed"); } finally { setLoading(false); } }

return ( <div className="min-h-dvh flex items-center justify-center p-6 bg-neutral-50"> <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4 bg-white p-6 rounded-2xl shadow"> <h1 className="text-xl font-semibold">Login – EHS Suite</h1> <div className="space-y-1"> <label className="text-sm text-neutral-600">Email</label> <input type="email" className="w-full rounded border px-3 py-2" value={email} onChange={(e) => setEmail(e.target.value)} required /> </div> <div className="space-y-1"> <label className="text-sm text-neutral-600">Password</label> <input type="password" className="w-full rounded border px-3 py-2" value={password} onChange={(e) => setPassword(e.target.value)} required /> </div> {error && <p className="text-sm text-red-600">{error}</p>} <button
disabled={loading}
className="w-full rounded-lg bg-black text-white py-2 hover:opacity-90 disabled:opacity-50"
>{loading ? "Signing in..." : "Sign in"}</button> <p className="text-xs text-neutral-500">Need an account? <Link href="#" className="underline">Ask admin</Link></p> </form> </div> ); }

// 3) app/(dashboard)/page.tsx // ---------------------------- // Simple KPI placeholders (replace with live queries later)

export default async function Dashboard() { const kpi = { incidents: 3, ppe: 96, audit: 85, training: 78, deltaInc: -25, deltaPpe: 2, deltaAudit: -5, deltaTrain: 3 }; const Arrow = ({v}:{v:number}) => <span className={"text-sm " + (v>=0?"text-green-600":"text-red-600")}>{v>=0?'▲':'▼'} {Math.abs(v)}%</span> const Card = ({title,children}:{title:string,children:any}) => ( <div className="rounded-2xl border bg-white p-4 shadow-sm"> <p className="text-sm text-neutral-500">{title}</p> <div className="mt-1 text-2xl font-semibold">{children}</div> </div> );

return ( <div className="p-6 space-y-6"> <h1 className="text-2xl font-bold">EHS Suite KPI Dashboard</h1> <div className="grid grid-cols-2 md:grid-cols-4 gap-4"> <Card title="Total Incidents">{kpi.incidents} <Arrow v={kpi.deltaInc} /></Card> <Card title="PPE Compliance">{kpi.ppe}% <Arrow v={kpi.deltaPpe} /></Card> <Card title="Audit Completion">{kpi.audit}% <Arrow v={kpi.deltaAudit} /></Card> <Card title="Training Coverage">{kpi.training}% <Arrow v={kpi.deltaTrain} /></Card> </div> <div className="text-sm text-neutral-500">(Data masih dummy. Sambungkan ke Firestore koleksi kpi_snapshots untuk live data.)</div> </div> ); }

// 4) Firestore Security Rules (paste via Firebase Console) // -------------------------------------------------------- // Sesuaikan role-claim di token auth jika perlu; ini MVPRBAC sederhana rules_version = '2'; service cloud.firestore { match /databases/{database}/documents { function signedIn() { return request.auth != null; } function role() { return request.auth.token.role; } function hasRole(r) { return signedIn() && role() in r; }

match /users/{uid} {
  allow read: if signedIn() && (request.auth.uid == uid || hasRole(['owner','ehs_manager']));
  allow write: if hasRole(['owner','ehs_manager']);
}

match /policies/{doc} {
  allow read: if hasRole(['owner','ehs_manager','supervisor','staff','contractor']);
  allow write: if hasRole(['owner','ehs_manager']);
}

match /hirarc/{doc} {
  allow read: if hasRole(['owner','ehs_manager','supervisor','staff']);
  allow create: if hasRole(['owner','ehs_manager','supervisor']);
  allow update, delete: if hasRole(['owner','ehs_manager']);
}

match /inspections/{doc} {
  allow read: if hasRole(['owner','ehs_manager','supervisor','staff']);
  allow create: if hasRole(['owner','ehs_manager','supervisor','staff']);
  allow update: if hasRole(['owner','ehs_manager','supervisor']);
  allow delete: if hasRole(['owner','ehs_manager']);
}

match /permits/{doc} {
  allow read: if hasRole(['owner','ehs_manager','supervisor','staff','contractor']);
  allow create: if hasRole(['owner','ehs_manager','supervisor','contractor']);
  allow update: if hasRole(['owner','ehs_manager','supervisor']);
  allow delete: if hasRole(['owner','ehs_manager']);
}

match /incidents/{doc} {
  allow read: if hasRole(['owner','ehs_manager','supervisor','staff']);
  allow create: if hasRole(['owner','ehs_manager','supervisor','staff']);
  allow update, delete: if hasRole(['owner','ehs_manager']);
}

match /capa/{doc} {
  allow read: if hasRole(['owner','ehs_manager','supervisor','staff']);
  allow create, update: if hasRole(['owner','ehs_manager','supervisor']);
  allow delete: if hasRole(['owner','ehs_manager']);
}

match /trainings/{doc} { allow read: if hasRole(['owner','ehs_manager','supervisor','staff']); allow write: if hasRole(['owner','ehs_manager']); }
match /audits/{doc}    { allow read: if hasRole(['owner','ehs_manager','supervisor']);        allow write: if hasRole(['owner','ehs_manager']); }
match /env_readings/{doc} { allow read: if hasRole(['owner','ehs_manager','supervisor','staff']); allow write: if hasRole(['owner','ehs_manager','supervisor','staff']); }
match /kpi_snapshots/{doc} { allow read: if signedIn(); allow write: if hasRole(['owner','ehs_manager']); }

} }

// 5) Quick Setup Notes (README) // ----------------------------- // - StackBlitz/Local: create Next.js (App Router), install deps: //   npm i firebase //   npm i -D tailwindcss postcss autoprefixer && npx tailwindcss init -p // - Add /lib/firebase.ts (this file) & pages above. // - Update /app/globals.css with Tailwind base. // - In Firebase Console, enable Authentication (Email/Password) and Firestore. // - Optional: set custom claims for roles via Admin SDK or callable function. // - If Storage init error occurs, switch storageBucket to "ehs-suite-fedff.appspot.com".

// 6) lib/firestore.ts // -------------------- // Reusable Firestore CRUD helpers (typed) + pagination + batch utils // Drop this file at /lib/firestore.ts

import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, getFirestore, orderBy, limit, query, serverTimestamp, setDoc, startAfter, Timestamp, updateDoc, where, writeBatch, increment, type DocumentData, type QueryConstraint, } from "firebase/firestore"; import { db } from "@/lib/firebase";

// ————— Generic helpers ————— // export type DocWithId<T = DocumentData> = T & { id: string };

export const colRef = (path: string) => collection(db, path); export const docRef = (path: string, id: string) => doc(db, path, id);

export async function createDoc<T extends DocumentData>(path: string, data: T) { const ref = await addDoc(colRef(path), { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp(), }); return ref.id; }

export async function setDocMerge<T extends DocumentData>(path: string, id: string, data: Partial<T>) { await setDoc(docRef(path, id), { ...data, updatedAt: serverTimestamp(), createdAt: serverTimestamp(), }, { merge: true }); }

export async function updateDocById<T extends DocumentData>(path: string, id: string, data: Partial<T>) { await updateDoc(docRef(path, id), { ...data, updatedAt: serverTimestamp() }); }

export async function deleteDocById(path: string, id: string) { await deleteDoc(docRef(path, id)); }

export async function getById<T extends DocumentData>(path: string, id: string): Promise<DocWithId<T> | null> { const snap = await getDoc(docRef(path, id)); if (!snap.exists()) return null; return { id: snap.id, ...(snap.data() as T) }; }

export async function listDocs<T extends DocumentData>(path: string, constraints: QueryConstraint[] = []): Promise<DocWithId<T>[]> { const q = query(colRef(path), ...constraints); const snap = await getDocs(q); return snap.docs.map(d => ({ id: d.id, ...(d.data() as T) })); }

// ————— Pagination ————— // export type PageResult<T> = { items: DocWithId<T>[]; nextCursor: Timestamp | null };

export async function listPaginated<T extends DocumentData>( path: string, opts: { pageSize?: number; cursor?: Timestamp | null; extra?: QueryConstraint[] } = {} ): Promise<PageResult<T>> { const { pageSize = 20, cursor = null, extra = [] } = opts; const base: QueryConstraint[] = [orderBy("createdAt", "desc"), limit(pageSize)]; const q = cursor ? query(colRef(path), ...extra, ...base, startAfter(cursor)) : query(colRef(path), ...extra, ...base); const snap = await getDocs(q); const items = snap.docs.map(d => ({ id: d.id, ...(d.data() as T) })); const nextCursor = snap.docs.length ? (snap.docs[snap.docs.length - 1].get("createdAt") as Timestamp | null) : null; return { items, nextCursor }; }

// ————— Counter helper (e.g., daily order number) ————— // export async function incrementCounter(path: string, id: string, field = "value", step = 1) { await setDoc(docRef(path, id), { [field]: increment(step) }, { merge: true }); }

// ————— Batch utils ————— // export async function batchUpdate(path: string, updates: { id: string; data: DocumentData }[]) { const batch = writeBatch(db); for (const u of updates) batch.update(docRef(path, u.id), { ...u.data, updatedAt: serverTimestamp() }); await batch.commit(); }

export async function batchDelete(path: string, ids: string[]) { const batch = writeBatch(db); for (const id of ids) batch.delete(docRef(path, id)); await batch.commit(); }

// ————— Example typed usage ————— // // Types you can reuse around the app export type HIRARC = { area: string; jobTask: string; hazards: string[]; controls: string[]; riskBefore: "Low" | "Medium" | "High"; riskAfter: "Low" | "Medium" | "High"; owner: string; // uid status: "Open" | "In Progress" | "Closed"; createdAt?: Timestamp; updatedAt?: Timestamp; };

// Create HIRARC export const createHIRARC = (data: Omit<HIRARC, "createdAt" | "updatedAt">) => createDoc<HIRARC>("hirarc", data as HIRARC);

// List HIRARC (open only) export const listOpenHIRARC = () => listDocs<HIRARC>("hirarc", [where("status", "==", "Open"), orderBy("createdAt", "desc"), limit(50)]);

// Update status HIRARC export const closeHIRARC = (id: string) => updateDocById<HIRARC>("hirarc", id, { status: "Closed" });

