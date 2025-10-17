// app/dashboard/page.tsx
import React from "react";
import DashboardClient from "./DashboardClient";

export const dynamic = "force-static"; // biar aman saat prerender (opsional)
export const revalidate = 0; // no cache SSG (opsional)

export default function DashboardPage() {
  return (
    <main className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">Dashboard KPI</h1>
      <DashboardClient />
    </main>
  );
}