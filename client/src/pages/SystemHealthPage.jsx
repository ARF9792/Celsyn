import { CheckCircle2, CircleDot, Database, Radio, Server, ShieldCheck } from "lucide-react";
import { lazy, Suspense, useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import SystemMetrics from "../components/SystemMetrics.jsx";
import { formatDateTime } from "../utils/telemetry.js";

const SystemTrendChart = lazy(() => import("../components/SystemTrendChart.jsx"));

const PipelineNode = ({ icon: Icon, label, value, detail, state = "active" }) => (
  <article className={`pipeline-node pipeline-node-${state}`}>
    <span className="pipeline-node-icon" aria-hidden="true"><Icon size={20} strokeWidth={1.8} /></span>
    <div><span>{label}</span><strong>{value}</strong><small>{detail}</small></div>
  </article>
);

const CounterGroup = ({ title, items }) => (
  <section className="panel system-counter-group">
    <div className="panel-heading"><div><p className="section-kicker">Current process</p><h2>{title}</h2></div></div>
    <dl>{items.map((item) => <div key={item.label}><dt>{item.label}</dt><dd>{item.value}</dd></div>)}</dl>
  </section>
);

export default function SystemHealthPage() {
  const dashboard = useOutletContext();
  const metrics = dashboard.metrics;
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (!metrics?.timestamp) return;
    setHistory((current) => {
      if (current.at(-1)?.timestamp === metrics.timestamp) return current;
      return [...current, metrics].slice(-60);
    });
  }, [metrics]);

  const exceptionCount = (metrics?.rejectedEvents ?? 0) + (metrics?.droppedEvents ?? 0);
  const posture = exceptionCount > 0
    ? { tone: "warning", title: "Pipeline exceptions have been recorded", detail: `${exceptionCount.toLocaleString()} rejected or dropped events since this process started.` }
    : (metrics?.currentEventsPerSecond ?? 0) > 0
      ? { tone: "healthy", title: "Telemetry is flowing through the pipeline", detail: `${metrics.currentEventsPerSecond} accepted events per second at the latest sample.` }
      : { tone: "offline", title: "The pipeline is waiting for telemetry", detail: "Start the simulator to populate throughput and persistence metrics." };

  return (
    <div className="page-stack system-health-page" data-enter>
      <section className={`system-posture system-posture-${posture.tone}`}>
        <span className="system-posture-icon" aria-hidden="true">{posture.tone === "healthy" ? <CheckCircle2 size={24} /> : <CircleDot size={24} />}</span>
        <div><p className="section-kicker">Pipeline state</p><h2>{posture.title}</h2><p>{posture.detail}</p></div>
        <time dateTime={metrics?.timestamp}>Updated {formatDateTime(metrics?.timestamp)}</time>
      </section>

      <SystemMetrics metrics={metrics} />

      <section className="panel pipeline-flow-panel">
        <div className="panel-heading"><div><p className="section-kicker">Ingestion to client</p><h2>Telemetry pipeline</h2></div><span className="record-count">Uptime {metrics?.uptimeSeconds ?? 0}s</span></div>
        <div className={`pipeline-map ${dashboard.connectionStatus === "connected" ? "is-live" : ""}`}>
          <PipelineNode icon={Server} label="Ingestion" value={(metrics?.eventsReceivedTotal ?? 0).toLocaleString()} detail="events received" />
          <span className="pipeline-connector" aria-hidden="true" />
          <PipelineNode icon={ShieldCheck} label="Validation" value={(metrics?.validEvents ?? 0).toLocaleString()} detail={`${metrics?.rejectedEvents ?? 0} rejected`} />
          <span className="pipeline-connector" aria-hidden="true" />
          <PipelineNode icon={Database} label="MongoDB" value={(metrics?.mongo?.persistedEvents ?? 0).toLocaleString()} detail={`${metrics?.mongo?.bufferedEvents ?? 0} buffered`} />
          <span className="pipeline-connector" aria-hidden="true" />
          <PipelineNode icon={Radio} label="Socket.IO" value={`${metrics?.broadcastMessagesPerSecond ?? 0}/s`} detail={`${metrics?.connectedClients ?? 0} clients`} state={dashboard.connectionStatus === "connected" ? "active" : "offline"} />
        </div>
      </section>

      <Suspense fallback={<section className="panel chart-empty">Loading pipeline chart…</section>}>
        <SystemTrendChart history={history} />
      </Suspense>

      <div className="system-counter-grid">
        <CounterGroup title="Ingestion counters" items={[
          { label: "Received", value: metrics?.eventsReceivedTotal?.toLocaleString() ?? 0 },
          { label: "Accepted", value: metrics?.validEvents?.toLocaleString() ?? 0 },
          { label: "Rejected", value: metrics?.rejectedEvents?.toLocaleString() ?? 0 },
          { label: "Dropped", value: metrics?.droppedEvents?.toLocaleString() ?? 0 },
        ]} />
        <CounterGroup title="Delivery counters" items={[
          { label: "Broadcast calls", value: metrics?.broadcastMessages?.toLocaleString() ?? 0 },
          { label: "Coalesced events", value: metrics?.coalescedEvents?.toLocaleString() ?? 0 },
          { label: "Persisted", value: metrics?.mongo?.persistedEvents?.toLocaleString() ?? 0 },
          { label: "Duplicate events", value: metrics?.mongo?.duplicateEvents?.toLocaleString() ?? 0 },
        ]} />
      </div>
    </div>
  );
}
