export default async function Dashboard() {
  const kpi = { incidents: 3, ppe: 96, audit: 85, training: 78, deltaInc: -25, deltaPpe: 2, deltaAudit: -5, deltaTrain: 3 };
  const Arrow = ({v}:{v:number}) => <span className={"text-sm " + (v>=0?"text-green-600":"text-red-600")}>{v>=0?'▲':'▼'} {Math.abs(v)}%</span>
  const Card = ({title,children}:{title:string,children:any}) => (
    <div className="card">
      <p className="text-sm text-neutral-500">{title}</p>
      <div className="mt-1 text-2xl font-semibold">{children}</div>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">EHS Suite KPI Dashboard</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card title="Total Incidents">{kpi.incidents} <Arrow v={kpi.deltaInc} /></Card>
        <Card title="PPE Compliance">{kpi.ppe}% <Arrow v={kpi.deltaPpe} /></Card>
        <Card title="Audit Completion">{kpi.audit}% <Arrow v={kpi.deltaAudit} /></Card>
        <Card title="Training Coverage">{kpi.training}% <Arrow v={kpi.deltaTrain} /></Card>
      </div>
      <div className="text-sm text-neutral-500">(Data dummy. Sambungkan Firestore koleksi `kpi_snapshots` untuk live data.)</div>
    </div>
  );
}
