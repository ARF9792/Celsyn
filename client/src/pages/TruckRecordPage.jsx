import { ArrowLeft, ArrowRight, DoorOpen, Fuel, Gauge, MapPin, Snowflake, Thermometer, Waves } from "lucide-react";
import { lazy, Suspense, useEffect, useState } from "react";
import { Link, useOutletContext, useParams } from "react-router-dom";
import { api } from "../services/api.js";
import { formatDateTime, formatDuration, formatNumber } from "../utils/telemetry.js";

const TemperatureChart = lazy(() => import("../components/TemperatureChart.jsx"));

const TelemetryItem = ({ icon: Icon, label, value, tone = "default" }) => (
  <article className={`record-metric record-metric-${tone}`}>
    <span className="record-metric-icon" aria-hidden="true"><Icon size={18} strokeWidth={1.8} /></span>
    <div><span>{label}</span><strong>{value}</strong></div>
  </article>
);

export default function TruckRecordPage() {
  const { truckId } = useParams();
  const dashboard = useOutletContext();
  const [compliance, setCompliance] = useState(null);
  const [complianceError, setComplianceError] = useState("");

  const truck = dashboard.trucks.find((item) => item.truckId === truckId) || null;
  const telemetry = truck?.latestTelemetry;
  const truckAlerts = dashboard.alerts.filter((alert) => alert.truckId === truckId).slice(0, 5);

  useEffect(() => {
    if (truck) dashboard.selectTruck(truck.truckId);
  }, [truck?.truckId]);

  useEffect(() => {
    if (!truckId) return undefined;
    let active = true;
    setCompliance(null);
    setComplianceError("");
    api.getTruckCompliance(truckId, 60)
      .then((payload) => { if (active) setCompliance(payload.analytics); })
      .catch((error) => { if (active) setComplianceError(error.message); });
    return () => { active = false; };
  }, [truckId]);

  if (dashboard.trucks.length > 0 && !truck) {
    return (
      <section className="panel not-found-panel">
        <p className="section-kicker">Unknown asset</p>
        <h2>{truckId} is not in the registered fleet.</h2>
        <Link className="text-action" to="/app/fleet"><ArrowLeft size={16} />Return to live fleet</Link>
      </section>
    );
  }

  if (!truck) return <section className="panel loading-panel">Loading truck record…</section>;

  const safeRange = `${truck.safeTemperature.min}–${truck.safeTemperature.max}°C`;
  const compliancePercentage = compliance?.compliancePercentage;
  const position = telemetry?.location
    ? `${telemetry.location.lat.toFixed(4)}, ${telemetry.location.lng.toFixed(4)}`
    : "—";

  return (
    <div className="page-stack truck-record-page" data-enter>
      <section className={`record-hero record-hero-${truck.status}`}>
        <div className="record-hero-main">
          <Link className="record-back" to="/app/fleet"><ArrowLeft size={16} />Live fleet</Link>
          <div className="record-title-row">
            <div>
              <p className="section-kicker">Refrigerated asset</p>
              <h2>{truck.truckId}</h2>
              <p>{truck.displayName} · {truck.cargoType}</p>
            </div>
            <span className={`status-pill status-${truck.status}`}>{truck.status}</span>
          </div>
        </div>
        <div className="record-route">
          <span>{truck.route.origin}</span><ArrowRight size={20} aria-hidden="true" /><span>{truck.route.destination}</span>
          <small>Updated {formatDateTime(telemetry?.timestamp)}</small>
        </div>
      </section>

      <section className="record-metric-grid" aria-label="Current truck telemetry">
        <TelemetryItem icon={Thermometer} label="Temperature" value={formatNumber(telemetry?.temperature, "°C")} tone={truck.status} />
        <TelemetryItem icon={Snowflake} label="Safe range" value={safeRange} />
        <TelemetryItem icon={Waves} label="Humidity" value={formatNumber(telemetry?.humidity, "%")} />
        <TelemetryItem icon={Gauge} label="Speed" value={formatNumber(telemetry?.speed, " km/h")} />
        <TelemetryItem icon={Fuel} label="Fuel" value={formatNumber(telemetry?.fuel, "%")} tone={(telemetry?.fuel ?? 100) < 15 ? "warning" : "default"} />
        <TelemetryItem icon={DoorOpen} label="Cargo door" value={telemetry ? (telemetry.doorOpen ? "Open" : "Closed") : "—"} tone={telemetry?.doorOpen ? "warning" : "default"} />
        <TelemetryItem icon={Snowflake} label="Reefer" value={telemetry?.reefer?.status || "—"} tone={telemetry?.reefer?.status === "failed" ? "critical" : "default"} />
        <TelemetryItem icon={MapPin} label="Position" value={position} />
      </section>

      <div className="record-workspace">
        <Suspense fallback={<section className="panel chart-panel chart-empty">Loading temperature chart…</section>}>
          <TemperatureChart truck={truck} series={dashboard.series} loading={dashboard.historyLoading} />
        </Suspense>
        <section className="panel compliance-snapshot">
          <div className="panel-heading">
            <div><p className="section-kicker">Last 60 minutes</p><h2>Temperature compliance</h2></div>
            <Link className="panel-action" to="/app/compliance">Open analytics<ArrowRight size={15} /></Link>
          </div>
          {complianceError && <div className="inline-error" role="alert">{complianceError}</div>}
          {!compliance && !complianceError && <p className="empty-copy">Calculating compliance from stored telemetry…</p>}
          {compliance && (
            <>
              <div className="compliance-score-row">
                <strong>{compliancePercentage == null ? "—" : `${compliancePercentage}%`}</strong>
                <span>within {safeRange}</span>
              </div>
              <div className="compliance-track" aria-label={`${compliancePercentage ?? 0}% within safe range`}>
                <span style={{ width: `${Math.max(0, Math.min(100, compliancePercentage ?? 0))}%` }} />
              </div>
              <dl className="record-facts">
                <div><dt>Excursions</dt><dd>{compliance.excursionCount}</dd></div>
                <div><dt>Out of range</dt><dd>{formatDuration(compliance.outOfRangeDurationMs)}</dd></div>
                <div><dt>Samples</dt><dd>{compliance.sampleCount.toLocaleString()}</dd></div>
              </dl>
            </>
          )}
        </section>
      </div>

      <section className="panel record-incidents">
        <div className="panel-heading">
          <div><p className="section-kicker">Recent detection events</p><h2>Truck incidents</h2></div>
          <Link className="panel-action" to="/app/incidents">Review incidents<ArrowRight size={15} /></Link>
        </div>
        {truckAlerts.length === 0 ? <p className="empty-copy">No recent incidents for this truck in the current server session.</p> : (
          <div className="record-incident-list">
            {truckAlerts.map((alert) => (
              <article key={alert.alertId}>
                <span className={`status-pill status-${alert.severity}`}>{alert.severity}</span>
                <div><strong>{alert.type.replaceAll("_", " ")}</strong><p>{alert.message}</p></div>
                <time dateTime={alert.timestamp}>{formatDateTime(alert.timestamp)}</time>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
