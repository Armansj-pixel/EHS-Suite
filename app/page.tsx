import Link from "next/link";

export default function Home() {
  return (
    <main className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">EHS Suite</h1>
      <p className="text-neutral-600">
        Selamat datang di <strong>EHS Suite</strong> — sistem digital untuk
        manajemen K3 & SMK3. <br />
        Silakan lanjut ke{" "}
        <Link href="/(auth)/login" className="underline text-blue-600">
          Halaman Login
        </Link>{" "}
        atau langsung buka{" "}
        <Link href="/(dashboard)" className="underline text-blue-600">
          Dashboard KPI
        </Link>
        .
      </p>
    </main>
  );
}
