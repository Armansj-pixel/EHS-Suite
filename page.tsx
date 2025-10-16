import Link from "next/link";
export default function Home() {
  return (
    <main className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">EHS Suite</h1>
      <p className="text-neutral-600">Welcome. Go to <Link href="/(dashboard)" className="underline">Dashboard</Link> or <Link href="/(auth)/login" className="underline">Login</Link>.</p>
    </main>
  );
}
