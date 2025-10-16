import { Timestamp } from "firebase/firestore";

/**
 * ===========================
 *  EHS KPI HELPER FUNCTIONS
 * ===========================
 *  Digunakan untuk menghitung KPI K3
 *  sesuai kebutuhan SMK3 & audit internal.
 */

export type KPIInput = {
  totalEmployees: number;      // jumlah pekerja
  totalHoursWorked: number;    // total jam kerja kumulatif
  totalIncidents: number;      // jumlah kecelakaan kerja (recordable)
  lostTimeIncidents: number;   // jumlah kecelakaan dengan waktu hilang
  nearMiss: number;            // laporan near miss
  unsafeActs: number;          // unsafe act report
  unsafeConditions: number;    // unsafe condition report
  ppeCompliant: number;        // jumlah pekerja patuh APD
  totalObserved: number;       // total pekerja diamati
};

/** Total Recordable Incident Rate (TRIR)
 *  = (Total Recordable x 1,000,000) / Total Jam Kerja
 */
export const calcTRIR = (input: KPIInput) => {
  const { totalIncidents, totalHoursWorked } = input;
  if (totalHoursWorked === 0) return 0;
  return (totalIncidents * 1_000_000) / totalHoursWorked;
};

/** Lost Time Injury Frequency Rate (LTIFR)
 *  = (Lost Time Injury x 1,000,000) / Total Jam Kerja
 */
export const calcLTIFR = (input: KPIInput) => {
  const { lostTimeIncidents, totalHoursWorked } = input;
  if (totalHoursWorked === 0) return 0;
  return (lostTimeIncidents * 1_000_000) / totalHoursWorked;
};

/** Near Miss Reporting Rate
 *  = (Near Miss x 100) / Total Pekerja
 */
export const calcNearMissRate = (input: KPIInput) => {
  const { nearMiss, totalEmployees } = input;
  if (totalEmployees === 0) return 0;
  return (nearMiss * 100) / totalEmployees;
};

/** PPE Compliance Rate
 *  = (Pekerja patuh APD / total pekerja yang diamati) * 100
 */
export const calcPPECompliance = (input: KPIInput) => {
  const { ppeCompliant, totalObserved } = input;
  if (totalObserved === 0) return 0;
  return (ppeCompliant * 100) / totalObserved;
};

/** Unsafe Observation Rate
 *  = ((Unsafe Acts + Unsafe Conditions) x 100) / Total Observasi
 */
export const calcUnsafeObservationRate = (input: KPIInput) => {
  const { unsafeActs, unsafeConditions, totalObserved } = input;
  if (totalObserved === 0) return 0;
  return ((unsafeActs + unsafeConditions) * 100) / totalObserved;
};

/** Generate summary KPI data */
export const generateKpiSummary = (input: KPIInput) => ({
  trir: parseFloat(calcTRIR(input).toFixed(2)),
  ltifr: parseFloat(calcLTIFR(input).toFixed(2)),
  nearMissRate: parseFloat(calcNearMissRate(input).toFixed(2)),
  ppeCompliance: parseFloat(calcPPECompliance(input).toFixed(2)),
  unsafeObservationRate: parseFloat(calcUnsafeObservationRate(input).toFixed(2)),
  updatedAt: Timestamp.now(),
});

/**
 * Contoh penggunaan:
 *
 * import { generateKpiSummary } from "@/lib/kpi";
 * const kpi = generateKpiSummary({
 *   totalEmployees: 120,
 *   totalHoursWorked: 18000,
 *   totalIncidents: 1,
 *   lostTimeIncidents: 0,
 *   nearMiss: 5,
 *   unsafeActs: 2,
 *   unsafeConditions: 1,
 *   ppeCompliant: 95,
 *   totalObserved: 100,
 * });
 *
 * console.log(kpi.trir, kpi.ppeCompliance);
 */

export type KPISnapshot = ReturnType<typeof generateKpiSummary>;