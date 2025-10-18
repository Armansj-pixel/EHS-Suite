// app/hazards/page.tsx
import HazardsClient from "./HazardsClient";

export const dynamic = "force-static";
export const revalidate = 0;

export default function HazardsPage() {
  return (
    <main className="p-6 max-w-6xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold text-gray-800">Hazard & Near Miss</h1>
      <HazardsClient />
    </main>
  );
}