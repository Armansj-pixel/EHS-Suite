import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

// pastikan dieksekusi runtime
export const dynamic = "force-dynamic";
export const revalidate = 0;

function normRange(fromStr?: string | null, toStr?: string | null) {
  const today = new Date();
  const dFrom = fromStr ? new Date(fromStr) : new Date(today.getTime() - 6 * 864e5);
  const dTo = toStr ? new Date(toStr) : today;
  dFrom.setHours(0, 0, 0, 0);
  dTo.setHours(23, 59, 59, 999);
  return { fromDate: dFrom, toDate: dTo };
}

// helper aman: Admin SDK aggregate count (fallback ke get().size)
async function safeCount(col: FirebaseFirestore.CollectionReference, filters: any[]) {
  try {
    // @ts-ignore count() tersedia di Admin SDK terbaru
    const q = filters.reduce((acc, f) => acc.where(f.field, f.op, f.value), col as any);
    if (typeof (q as any).count === "function") {
      const agg = await (q as any).count().get();
      return agg.data().count ?? 0;
    }
    const snap = await (q as any).get();
    return snap.size ?? 0;
  } catch {
    return 0;
  }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const { fromDate, toDate } = normRange(url.searchParams.get("from"), url.searchParams.get("to"));

    const hazCol = adminDb.collection("hazard_reports");
    const nearCol = adminDb.collection("nearmiss_reports");
    const inspCol = adminDb.collection("inspections");

    const filtersRange = [
      { field: "createdAt", op: ">=", value: fromDate },
      { field: "createdAt", op: "<=", value: toDate },
    ];

    const [hazards, nearmiss, inspections, closedHazards] = await Promise.all([
      safeCount(hazCol, filtersRange),
      safeCount(nearCol, filtersRange),
      safeCount(inspCol, filtersRange),
      safeCount(hazCol, [
        { field: "status", op: "==", value: "closed" },
        ...filtersRange,
      ]),
    ]);

    // Placeholder sederhana untuk tren mingguan (isi 0 dulu)
    const trendWeekly = Array(7).fill(0);

    return NextResponse.json({ hazards, nearmiss, inspections, closedHazards, trendWeekly }, { status: 200 });
  } catch (e) {
    // Jangan bikin UI error—kembalikan angka nol
    return NextResponse.json(
      { hazards: 0, nearmiss: 0, inspections: 0, closedHazards: 0, trendWeekly: Array(7).fill(0) },
      { status: 200 }
    );
  }
}