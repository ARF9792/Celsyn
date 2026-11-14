import { Activity, Database, RadioTower, Timer } from "lucide-react";

export default function KpiGrid({ summary, metrics }) {
  const cards = [
    { label: "Fleet reporting", value: `${summary.onlineTrucks}/${summary.totalTrucks}`, detail: "vehicles online", Icon: RadioTower },
    { label: "Telemetry rate", value: metrics?.currentEventsPerSecond ?? 0, detail: "events per second", Icon: Activity },
    { label: "Broadcast latency", value: `${metrics?.averageBroadcastLatencyMs ?? 0} ms`, detail: "ingestion to client", Icon: Timer },
    { label: "Persistence queue", value: metrics?.mongo?.bufferedEvents ?? 0, detail: "events buffered", Icon: Database },
  ];

  return (
    <section className="kpi-grid" aria-label="Live operating metrics">
      {cards.map(({ label, value, detail, Icon }) => (
        <article className="kpi-card" key={label}>
          <span className="kpi-icon" aria-hidden="true"><Icon size={18} strokeWidth={1.7} /></span>
          <div>
            <span>{label}</span>
            <strong>{value}</strong>
            <small>{detail}</small>
          </div>
        </article>
      ))}
    </section>
  );
}

