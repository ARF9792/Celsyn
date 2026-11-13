const Metric = ({ label, value }) => (
  <div className="metric-item"><span>{label}</span><strong>{value ?? 0}</strong></div>
);

export default function SystemMetrics({ metrics }) {
  return (
    <section className="panel metrics-panel">
      <div className="panel-heading"><div><p className="section-kicker">Pipeline health</p><h2>System metrics</h2></div></div>
      <div className="metrics-grid">
        <Metric label="Events / sec" value={metrics?.currentEventsPerSecond} />
        <Metric label="Connected clients" value={metrics?.connectedClients} />
        <Metric label="Broadcast / sec" value={metrics?.broadcastMessagesPerSecond} />
        <Metric label="Avg latency" value={`${metrics?.averageBroadcastLatencyMs ?? 0} ms`} />
        <Metric label="Total accepted" value={metrics?.validEvents?.toLocaleString()} />
        <Metric label="Rejected" value={metrics?.rejectedEvents?.toLocaleString()} />
        <Metric label="Mongo buffered" value={metrics?.mongo?.bufferedEvents} />
        <Metric label="Mongo persisted" value={metrics?.mongo?.persistedEvents?.toLocaleString()} />
      </div>
    </section>
  );
}

