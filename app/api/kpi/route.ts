// app/api/kpi/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, getCountFromServer, query, where } from "firebase/firestore";

export const runtime = "nodejs"; // gunakan node runtime

async function count(col: string, statusFilter?: [string, any]) {
  const ref = collection(db, col);
  const q = statusFilter ? query(ref, where(statusFilter[0], "==", statusFilter[1])) : ref;
  const snap = await getCountFromServer(q);
  return snap.data().count ?? 0;
}

export async function GET() {
  try {
    const [inspections, hazards, hirarcOpen, ptwActive] = await Promise.all([
      count("inspections"),
      count("hazard_reports"),
      count("hirarc", ["status", "Open"]),
      count("ptw", ["status", "Approved"]),
    ]);

    return NextResponse.json({
      inspections,
      hazards,
      hirarcOpen,
      ptwActive,
      updatedAt: Date.now(),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "KPI fetch failed" }, { status: 500 });
  }
}