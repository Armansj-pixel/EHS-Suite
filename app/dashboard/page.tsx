import AuthGate from "@/components/AuthGate";
import DashboardClient from "./DashboardClient";

export const dynamic = "force-dynamic"; // cegah prerender mengganggu fetch client

export default function Page() {
  return (
    <AuthGate>
      <div className="max-w-6xl mx-auto p-4 md:p-6">
        <DashboardClient />
      </div>
    </AuthGate>
  );
}