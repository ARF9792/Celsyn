import { AlertTriangle, ArrowRight, Fuel, Search, Snowflake, Thermometer, Warehouse, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { formatDateTime, formatNumber } from "../utils/telemetry.js";

const incidentIcons = {
  TEMPERATURE_WARNING: Thermometer,
  TEMPERATURE_CRITICAL: Thermometer,
  REEFER_FAILURE: Snowflake,
  DOOR_OPEN_WHILE_MOVING: Warehouse,
  LOW_FUEL: Fuel,
};

const labelType = (type = "") => type.toLowerCase().replaceAll("_", " ");

const formatDetail = (key, value) => {
  if (key === "temperature") return formatNumber(value, "°C");
  if (key === "speed") return formatNumber(value, " km/h");
  if (key === "fuel" || key === "reeferPower") return formatNumber(value, "%");
  if (key === "safeRange") return `${value.min}–${value.max}°C`;
  return String(value);
};

export default function IncidentsPage() {
  const dashboard = useOutletContext();
  const [query, setQuery] = useState("");
  const [severity, setSeverity] = useState("all");
  const [type, setType] = useState("all");
  const [truckId, setTruckId] = useState("all");
  const [selectedAlertId, setSelectedAlertId] = useState(null);

  const alertTypes = useMemo(() => [...new Set(dashboard.alerts.map((alert) => alert.type))].sort(), [dashboard.alerts]);
  const alertTrucks = useMemo(() => [...new Set(dashboard.alerts.map((alert) => alert.truckId))].sort(), [dashboard.alerts]);
  const normalizedQuery = query.trim().toLowerCase();
  const filteredAlerts = useMemo(() => dashboard.alerts.filter((alert) => {
    if (severity !== "all" && alert.severity !== severity) return false;
    if (type !== "all" && alert.type !== type) return false;
    if (truckId !== "all" && alert.truckId !== truckId) return false;
    if (!normalizedQuery) return true;
    return [alert.truckId, alert.type, alert.message].filter(Boolean).join(" ").toLowerCase().includes(normalizedQuery);
  }), [dashboard.alerts, normalizedQuery, severity, type, truckId]);

  const selectedAlert = filteredAlerts.find((alert) => alert.alertId === selectedAlertId) || filteredAlerts[0] || null;
  const critical = dashboard.alerts.filter((alert) => alert.severity === "critical").length;
  const warning = dashboard.alerts.filter((alert) => alert.severity === "warning").length;
  const affectedTrucks = new Set(dashboard.alerts.map((alert) => alert.truckId)).size;
  const hasFilters = query || severity !== "all" || type !== "all" || truckId !== "all";

  const resetFilters = () => {
    setQuery("");
    setSeverity("all");
    setType("all");
    setTruckId("all");
  };

  return (
    <div className="page-stack incidents-page" data-enter>
      <section className="incident-posture">
        <div>
          <p className="section-kicker">Current server session</p>
          <h2>{critical > 0 ? `${critical} critical incidents require review` : "No critical incidents in the current stream"}</h2>
          <p>{dashboard.alerts.length} detection events across {affectedTrucks} refrigerated trucks.</p>
        </div>
        <div className="incident-counts" aria-label="Incident totals">
          <span><strong>{critical}</strong>Critical</span>
          <span><strong>{warning}</strong>Warning</span>
          <span><strong>{dashboard.alerts.length}</strong>Total</span>
        </div>
      </section>

      <section className="panel incident-toolbar" aria-label="Incident filters">
        <label className="fleet-search incident-search">
          <Search size={17} aria-hidden="true" />
          <span className="sr-only">Search incidents</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search truck, incident or message" />
        </label>
        <label><span>Severity</span><select value={severity} onChange={(event) => setSeverity(event.target.value)}><option value="all">All severities</option><option value="critical">Critical</option><option value="warning">Warning</option></select></label>
        <label><span>Incident type</span><select value={type} onChange={(event) => setType(event.target.value)}><option value="all">All incident types</option>{alertTypes.map((item) => <option key={item} value={item}>{labelType(item)}</option>)}</select></label>
        <label><span>Truck</span><select value={truckId} onChange={(event) => setTruckId(event.target.value)}><option value="all">All trucks</option>{alertTrucks.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <div className="filter-result"><strong>{filteredAlerts.length}</strong><span>of {dashboard.alerts.length}</span></div>
        {hasFilters && <button className="filter-reset" type="button" onClick={resetFilters}><X size={14} />Clear</button>}
      </section>

      <div className="incident-workspace">
        <section className="panel incident-queue">
          <div className="panel-heading"><div><p className="section-kicker">Newest first</p><h2>Incident queue</h2></div><span className="record-count">{filteredAlerts.length} events</span></div>
          <div className="incident-queue-list">
            {filteredAlerts.length === 0 && <p className="empty-copy">No incidents match the current filters.</p>}
            {filteredAlerts.map((alert) => {
              const Icon = incidentIcons[alert.type] || AlertTriangle;
              const selected = alert.alertId === selectedAlert?.alertId;
              return (
                <button className={`incident-row incident-row-${alert.severity} ${selected ? "is-selected" : ""}`} type="button" key={alert.alertId} onClick={() => setSelectedAlertId(alert.alertId)} aria-pressed={selected}>
                  <span className="incident-row-icon" aria-hidden="true"><Icon size={18} /></span>
                  <span className="incident-row-copy"><strong>{labelType(alert.type)}</strong><small>{alert.truckId} · {formatDateTime(alert.timestamp)}</small><span>{alert.message}</span></span>
                  <span className={`status-pill status-${alert.severity}`}>{alert.severity}</span>
                </button>
              );
            })}
          </div>
        </section>

        <aside className="panel incident-detail" aria-live="polite">
          {!selectedAlert ? <p className="empty-copy">Select an incident to inspect its detection data.</p> : (
            <>
              <div className="incident-detail-head">
                <span className={`status-pill status-${selectedAlert.severity}`}>{selectedAlert.severity}</span>
                <time dateTime={selectedAlert.timestamp}>{formatDateTime(selectedAlert.timestamp)}</time>
              </div>
              <p className="section-kicker">Detection event</p>
              <h2>{labelType(selectedAlert.type)}</h2>
              <p className="incident-message">{selectedAlert.message}</p>
              <dl className="incident-facts">
                <div><dt>Truck</dt><dd>{selectedAlert.truckId}</dd></div>
                <div><dt>Source event</dt><dd>{selectedAlert.sourceEventId || "—"}</dd></div>
                {Object.entries(selectedAlert.details || {}).map(([key, value]) => (
                  <div key={key}><dt>{key.replace(/([A-Z])/g, " $1")}</dt><dd>{formatDetail(key, value)}</dd></div>
                ))}
              </dl>
              <div className="incident-detail-actions">
                <Link className="text-action" to={`/app/fleet/${selectedAlert.truckId}`} onClick={() => dashboard.selectTruck(selectedAlert.truckId)}>Open truck record<ArrowRight size={16} /></Link>
                <Link className="icon-text-button" to="/app/fleet" onClick={() => dashboard.selectTruck(selectedAlert.truckId)}>Locate in fleet</Link>
              </div>
              <p className="incident-limit">ChainPulse currently records detection events. Acknowledgement and resolution states are not stored by the backend.</p>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
