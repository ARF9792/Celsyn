import { formatTime } from "../utils/telemetry.js";

export default function AlertsPanel({ alerts }) {
  return (
    <section className="panel alerts-panel">
      <div className="panel-heading">
        <div><p className="section-kicker">Incident stream</p><h2>Latest alerts</h2></div>
        <span className="record-count">{alerts.length}</span>
      </div>
      <div className="alert-list">
        {alerts.length === 0 && <p className="empty-copy">No active incidents in this session.</p>}
        {alerts.map((alert) => (
          <article className={`alert-item alert-${alert.severity}`} key={alert.alertId}>
            <span className="alert-mark" />
            <div>
              <strong>{alert.type.replaceAll("_", " ")}</strong>
              <p>{alert.message}</p>
              <small>{alert.truckId} · {formatTime(alert.timestamp)}</small>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

