import { ArrowUpRight, LocateFixed, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { formatNumber, formatTime } from "../utils/telemetry.js";

const Detail = ({ label, value, wide = false }) => (
  <div className={`detail-item ${wide ? "detail-item-wide" : ""}`}><span>{label}</span><strong>{value}</strong></div>
);

export default function TruckDetails({ truck, onTrigger, demoPending, onLocate }) {
  if (!truck) return <section className="panel empty-panel">Select a truck to inspect it.</section>;
  const telemetry = truck.latestTelemetry;
  const position = telemetry?.location
    ? `${telemetry.location.lat.toFixed(4)}, ${telemetry.location.lng.toFixed(4)}`
    : "—";

  return (
    <section className="panel truck-panel">
      <div className="panel-heading">
        <div><p className="section-kicker">Selected asset</p><h2>{truck.truckId}</h2></div>
        <span className={`status-pill status-${truck.status}`}>{truck.status}</span>
      </div>
      <p className="truck-name">{truck.displayName} · {truck.cargoType}</p>
      <p className="route-line">{truck.route.origin} <span>→</span> {truck.route.destination}</p>
      <div className="detail-grid">
        <Detail label="Temperature" value={formatNumber(telemetry?.temperature, "°C")} />
        <Detail label="Safe range" value={`${truck.safeTemperature.min}–${truck.safeTemperature.max}°C`} />
        <Detail label="Humidity" value={formatNumber(telemetry?.humidity, "%")} />
        <Detail label="Speed" value={formatNumber(telemetry?.speed, " km/h")} />
        <Detail label="Fuel" value={formatNumber(telemetry?.fuel, "%")} />
        <Detail label="Door" value={telemetry ? (telemetry.doorOpen ? "Open" : "Closed") : "—"} />
        <Detail label="Reefer" value={telemetry?.reefer?.status || "—"} />
        <Detail label="Last update" value={formatTime(telemetry?.timestamp)} />
        <Detail label="Current position" value={position} wide />
      </div>
      <div className="truck-actions">
        <button className="icon-text-button truck-locate-button" type="button" onClick={onLocate}>
          <LocateFixed size={16} aria-hidden="true" />Locate on map
        </button>
        <Link className="future-truck-link" to={`/app/fleet/${truck.truckId}`}>
          <MapPin size={16} aria-hidden="true" />Open full record<ArrowUpRight size={14} aria-hidden="true" />
        </Link>
      </div>
      <button className="demo-button" type="button" onClick={onTrigger} disabled={demoPending}>
        {demoPending ? "Activating…" : "Trigger temperature excursion"}
      </button>
      <p className="demo-note">Development demo: subsequent simulator events will rise above the safe range.</p>
    </section>
  );
}

