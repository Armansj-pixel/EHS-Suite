// lib/firebaseAdmin.ts
import { getApps, initializeApp, cert, App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

/**
 * Simpan credential service account (JSON) di Vercel Env:
 * FIREBASE_SERVICE_ACCOUNT_JSON  -> seluruh JSON service account (string)
 */
let app: App;

if (!getApps().length) {
  const svc = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!svc) {
    throw new Error("Missing FIREBASE_SERVICE_ACCOUNT_JSON");
  }
  app = initializeApp({
    credential: cert(JSON.parse(svc)),
  });
} else {
  app = getApps()[0]!;
}

export const adminDb = getFirestore(app);