// app/inspections/page.tsx
import InspectionsClient from "./InspectionsClient";

export const dynamic = "force-static";
export const revalidate = 0;

export default function InspectionsPage() {
  return (
    <main className="p-6 max-w-6xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold text-gray-800">Inspeksi</h1>
      <InspectionsClient />
    </main>
  );
}