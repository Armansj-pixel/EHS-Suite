import TopBar from "@/components/TopBar";
import DashboardClient from "./DashboardClient";

export const dynamic = "force-dynamic"; // biar fetch tidak error saat build
export const revalidate = 0;

export default function DashboardPage() {
  return (
    <main className="p-6 min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Bagian Header */}
        <TopBar />

        {/* Konten Utama Dashboard */}
        <section className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Dashboard KPI
          </h2>
          <DashboardClient />
        </section>
      </div>
    </main>
  );
}