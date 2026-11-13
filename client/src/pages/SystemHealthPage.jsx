import { useOutletContext } from "react-router-dom";
import SystemMetrics from "../components/SystemMetrics.jsx";

export default function SystemHealthPage() {
  const dashboard = useOutletContext();
  const metrics = dashboard.metrics;

  return (
    <div className="page-stack">
      <SystemMetrics metrics={metrics} />
      <section className="panel pipeline-flow">
        <div className="panel-heading"><div><p className="section-kicker">Telemetry path</p><h2>Pipeline overview</h2></div></div>
        <div className="pipeline-steps">
          <span>Simulator</span><b>→</b><span>Validation</span><b>→</b><span>Fleet state</span><b>→</b><span>MongoDB</span><b>+</b><span>Socket.IO</span>
        </div>
        <p>Intermediate truck states are persisted while visual broadcasts are intentionally coalesced for responsive clients.</p>
      </section>
      <section className="summary-card-grid">
        <article className="summary-card"><span>Coalesced events</span><strong>{metrics?.coalescedEvents?.toLocaleString() ?? 0}</strong><small>saved visual updates</small></article>
        <article className="summary-card"><span>Duplicate events</span><strong>{metrics?.mongo?.duplicateEvents?.toLocaleString() ?? 0}</strong><small>handled by MongoDB</small></article>
        <article className="summary-card"><span>Dropped events</span><strong>{metrics?.droppedEvents?.toLocaleString() ?? 0}</strong><small>pipeline loss</small></article>
        <article className="summary-card"><span>Uptime</span><strong>{metrics?.uptimeSeconds ?? 0}s</strong><small>current process</small></article>
      </section>
    </div>
  );
}

