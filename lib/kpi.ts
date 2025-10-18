// lib/kpi.ts
import { db } from "@/lib/firestore";
import {
  collection,
  getCountFromServer,
  query,
  where,
  Timestamp,
} from "firebase/firestore";

export type KpiWindow = { from: Date; to: Date };

export type KpiResult = {
  totalInspections: number;
  openInspections: number;
  closedInspections: number;
  totalHazards: number;
  openHazards: number;
  closedHazards: number;
};

function toTs(d: Date) {
  return Timestamp.fromDate(d);
}

export async function fetchKPI({ from, to }: KpiWindow): Promise<KpiResult> {
  const fromTs = toTs(from);
  const toTs = toTs(to);

  // --- Inspections ---
  const insBase = query(
    collection(db, "inspections"),
    where("createdAt", ">=", fromTs),
    where("createdAt", "<=", toTs)
  );
  const [insAllSnap, insOpenSnap, insClosedSnap] = await Promise.all([
    getCountFromServer(insBase),
    getCountFromServer(query(insBase, where("status", "in", ["Open", "In Progress"]))),
    getCountFromServer(query(insBase, where("status", "==", "Closed"))),
  ]);

  // --- Hazards ---
  const hazBase = query(
    collection(db, "hazards"),               // <— pastikan pakai "hazards"
    where("createdAt", ">=", fromTs),
    where("createdAt", "<=", toTs)
  );
  const [hazAllSnap, hazOpenSnap, hazClosedSnap] = await Promise.all([
    getCountFromServer(hazBase),
    getCountFromServer(query(hazBase, where("status", "in", ["Open", "In Progress"]))),
    getCountFromServer(query(hazBase, where("status", "==", "Closed"))),
  ]);

  return {
    totalInspections: insAllSnap.data().count,
    openInspections: insOpenSnap.data().count,
    closedInspections: insClosedSnap.data().count,
    totalHazards: hazAllSnap.data().count,
    openHazards: hazOpenSnap.data().count,
    closedHazards: hazClosedSnap.data().count,
  };
}