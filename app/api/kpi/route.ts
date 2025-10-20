import { NextResponse } from "next/server";
import { db } from "@/lib/firestore";
import {
  collection,
  getCountFromServer,
  query,
  where,
  Timestamp,
  orderBy,
} from "firebase/firestore";

/**
 * GET /api/kpi?from=YYYY-MM-DD&to=YYYY-MM-DD
 * Selalu kembalikan 200 agar UI tidak fail; jika ada error, field terkait dibuat 0.
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const fromStr = url.searchParams.get("from");
    const toStr = url.searchParams.get("to");

    // fallback 7 hari terakhir
    const today = new Date();
    const dFrom = fromStr ? new Date(fromStr) : new Date(today.getTime() - 6 * 864e5);
    const dTo = toStr ? new Date(toStr) : today;

    // normalisasi ke awal & akhir hari
    const from = Timestamp.fromDate(new Date(dFrom.setHours(0, 0, 0, 0)));
    const to = Timestamp.fromDate(new Date(dTo.setHours(23, 59, 59, 999)));

    // helper aman (error -> 0)
    const safeCount = async (qRef: any) => {
      try {
        const snap = await getCountFromServer(qRef);
        return snap.data().count ?? 0;
      } catch {
        return 0;
      }
    };

    // koleksi yang dipakai
    const colHaz = collection(db, "hazard_reports");
    const colNear = collection(db, "nearmiss_reports"); // sesuaikan jika beda nama
    const colInsp = collection(db, "inspections");

    // total range by createdAt
    const qHaz = query(colHaz, where("createdAt", ">=", from), where("createdAt", "<=", to));
    const qNear = query(colNear, where("createdAt", ">=", from), where("createdAt", "<=", to));
    const qInsp = query(colInsp, where("createdAt", ">=", from), where("createdAt", "<=", to));

    const [hazards, nearmiss, inspections] = await Promise.all([
      safeCount(qHaz),
      safeCount(qNear),
      safeCount(qInsp),
    ]);

    // closed hazards (butuh index komposit; jika belum ada akan fallback 0)
    const qHazClosed = query(
      colHaz,
      where("status", "==", "closed"),
      where("createdAt", ">=", from),
      where("createdAt", "<=", to)
    );
    const closedHazards = await safeCount(qHazClosed);

    // trend 7 hari (simple: hitung harian dari hazard+nearmiss+inspeksi)
    // Supaya ringan & tanpa agregasi berat, kita pakai hitungan dummy nol.
    // Kalau mau akurat, bisa diganti kumpulkan count per hari (boleh menyusul).
    const trendWeekly = Array(7).fill(0);

    return NextResponse.json(
      { hazards, nearmiss, inspections, closedHazards, trendWeekly },
      { status: 200 }
    );
  } catch (e: any) {
    // fallback total nol supaya UI tetap hidup
    return NextResponse.json(
      { hazards: 0, nearmiss: 0, inspections: 0, closedHazards: 0, trendWeekly: Array(7).fill(0) },
      { status: 200 }
    );
  }
}