import { useOutletContext } from "react-router-dom";
import AlertsPanel from "../components/AlertsPanel.jsx";

export default function IncidentsPage() {
  const dashboard = useOutletContext();
  const critical = dashboard.alerts.filter((alert) => alert.severity === "critical").length;
  const warning = dashboard.alerts.filter((alert) => alert.severity === "warning").length;
  const affectedTrucks = new Set(dashboard.alerts.map((alert) => alert.truckId)).size;

  return (
    <div className="page-stack">
      <section className="summary-card-grid">
        <article className="summary-card"><span>Total incidents</span><strong>{dashboard.alerts.length}</strong><small>recent session events</small></article>
        <article className="summary-card summary-critical"><span>Critical</span><strong>{critical}</strong><small>immediate action</small></article>
        <article className="summary-card summary-warning"><span>Warnings</span><strong>{warning}</strong><small>needs attention</small></article>
        <article className="summary-card"><span>Affected trucks</span><strong>{affectedTrucks}</strong><small>unique assets</small></article>
      </section>
      <AlertsPanel alerts={dashboard.alerts} />
      <section className="panel reference-note">
        <p className="section-kicker">Next design pass</p>
        <h2>Incident workflow reference area</h2>
        <p>Add filters, acknowledgement, resolution status and an incident-detail drawer after choosing the visual reference.</p>
      </section>
    </div>
  );
}

