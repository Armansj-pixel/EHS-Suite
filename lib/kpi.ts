// lib/kpi.ts

import { db } from '@/lib/firestore'; // Pastikan Anda sudah mengimpor Firestore
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';

interface KpiWindow {
  from: Date;
  to: Date;
}

interface KpiResult {
  // Define your result structure here
  totalRecords: number;
  success: boolean;
}

// Fungsi toTs untuk mengonversi Date menjadi timestamp
const toTs = (date: Date): number => {
  return date.getTime();
};

export async function fetchKPI({ from, to }: KpiWindow): Promise<KpiResult> {
  // Pastikan toTs digunakan setelah deklarasi
  const fromTs = toTs(from);
  const toTsValue = toTs(to);

  try {
    // Mendapatkan data dari Firestore
    const q = query(
      collection(db, 'kpiCollection'), // Gantilah 'kpiCollection' dengan nama koleksi Firestore Anda
      where('date', '>=', fromTs),
      where('date', '<=', toTsValue),
      orderBy('date', 'desc'),
      limit(50) // Anda bisa menyesuaikan jumlah limit ini
    );

    const querySnapshot = await getDocs(q);
    const records = querySnapshot.docs.map((doc) => doc.data());
    
    // Kembalikan hasil KPI dalam bentuk yang sesuai
    return {
      totalRecords: records.length,
      success: true,
    };
  } catch (error) {
    console.error('Error fetching KPI:', error);
    return {
      totalRecords: 0,
      success: false,
    };
  }
}