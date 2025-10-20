// app/dashboard/page.tsx
import AuthGate from "@/components/AuthGate";
import dynamic from "next/dynamic";

const DashboardClient = dynamic(() => import("./DashboardClient"), { ssr: false });

export default function DashboardPage() {
  return (
    <AuthGate>
      <DashboardClient />
    </AuthGate>
  );
}