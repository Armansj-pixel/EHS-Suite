// lib/kpi.ts
export type KPIData = {
  inspections: number;
  hazards: number;
  hirarcOpen: number;
  ptwActive: number;
  updatedAt: number;
};

export async function fetchKPI(): Promise<KPIData> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/kpi`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to load KPI");
  return res.json();
}