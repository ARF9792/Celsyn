import { Activity, Database, Radio, Users } from "lucide-react";

const Metric = ({ icon: Icon, label, value, detail }) => (
  <article className="system-primary-metric">
    <span className="system-metric-icon" aria-hidden="true"><Icon size={19} strokeWidth={1.8} /></span>
    <div><span>{label}</span><strong>{value ?? 0}</strong><small>{detail}</small></div>
  </article>
);

export default function SystemMetrics({ metrics }) {
  return (
    <section className="system-primary-grid" aria-label="Current pipeline metrics">
      <Metric icon={Activity} label="Accepted events" value={`${metrics?.currentEventsPerSecond ?? 0}/s`} detail={`${metrics?.validEvents?.toLocaleString() ?? 0} total`} />
      <Metric icon={Radio} label="Broadcast calls" value={`${metrics?.broadcastMessagesPerSecond ?? 0}/s`} detail={`${metrics?.averageBroadcastLatencyMs ?? 0} ms average latency`} />
      <Metric icon={Database} label="Persistence queue" value={metrics?.mongo?.bufferedEvents ?? 0} detail={`${metrics?.mongo?.persistedEvents?.toLocaleString() ?? 0} persisted`} />
      <Metric icon={Users} label="Live clients" value={metrics?.connectedClients ?? 0} detail="authenticated sockets" />
    </section>
  );
}
