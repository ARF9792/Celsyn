import { AlertTriangle, ArrowUpRight, Fuel, Snowflake, Thermometer, Warehouse } from "lucide-react";
import { Link } from "react-router-dom";
import { formatTime } from "../utils/telemetry.js";

const alertIcons = {
  temperature_warning: Thermometer,
  temperature_critical: Thermometer,
  reefer_failed: Snowflake,
  door_open_while_moving: Warehouse,
  low_fuel: Fuel,
};

export default function AlertsPanel({
  alerts,
  heading = "Latest alerts",
  kicker = "Incident stream",
  actionTo,
  actionLabel,
  variant = "default",
}) {
  return (
    <section className={`panel alerts-panel alerts-panel-${variant}`}>
      <div className="panel-heading">
        <div><p className="section-kicker">{kicker}</p><h2>{heading}</h2></div>
        {actionTo ? (
          <Link className="panel-action" to={actionTo}>{actionLabel}<ArrowUpRight size={15} aria-hidden="true" /></Link>
        ) : <span className="record-count">{alerts.length}</span>}
      </div>
      <div className="alert-list">
        {alerts.length === 0 && <p className="empty-copy">No active incidents in this session.</p>}
        {alerts.map((alert) => {
          const Icon = alertIcons[alert.type] || AlertTriangle;
          return (
            <article className={`alert-item alert-${alert.severity}`} key={alert.alertId}>
              <span className="alert-icon" aria-hidden="true"><Icon size={17} strokeWidth={1.8} /></span>
              <div>
                <div className="alert-meta"><strong>{alert.type.replaceAll("_", " ")}</strong><time dateTime={alert.timestamp}>{formatTime(alert.timestamp)}</time></div>
                <p>{alert.message}</p>
                <small>{alert.truckId}</small>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

