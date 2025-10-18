export default function HazardsPage() {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Hazards</h1>
        <a href="/hazards/new" className="px-3 py-2 rounded bg-gray-900 text-white text-sm">Laporkan Hazard</a>
      </div>
      {/* TODO: render list hazard (nanti) */}
      <p className="text-sm text-gray-500">Daftar hazard akan tampil di sini.</p>
    </div>
  );
}