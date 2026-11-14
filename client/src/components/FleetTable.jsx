import { ArrowUpRight, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { formatNumber, formatTime } from "../utils/telemetry.js";

export default function FleetTable({
  trucks,
  selectedTruckId,
  onSelect,
  heading = "Fleet overview",
  kicker = "Live state",
  actionTo,
  actionLabel,
  variant = "default",
}) {
  return (
    <section className={`panel fleet-panel fleet-panel-${variant}`}>
      <div className="panel-heading">
        <div>
          <p className="section-kicker">{kicker}</p>
          <h2>{heading}</h2>
        </div>
        {actionTo ? (
          <Link className="panel-action" to={actionTo}>{actionLabel}<ArrowUpRight size={15} aria-hidden="true" /></Link>
        ) : <span className="record-count">{trucks.length} trucks</span>}
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Truck</th><th>Temperature</th><th>Humidity</th><th>Speed</th>
              <th>Reefer</th><th>Status</th><th>Updated</th>
            </tr>
          </thead>
          <tbody>
            {trucks.map((truck) => {
              const telemetry = truck.latestTelemetry;
              return (
                <tr
                  key={truck.truckId}
                  className={selectedTruckId === truck.truckId ? "selected-row" : ""}
                  onClick={() => onSelect(truck.truckId)}
                  tabIndex="0"
                  aria-selected={selectedTruckId === truck.truckId}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onSelect(truck.truckId);
                    }
                  }}
                >
                  <td><strong>{truck.truckId}</strong><small>{truck.cargoType}</small></td>
                  <td>{formatNumber(telemetry?.temperature, "°C")}</td>
                  <td>{formatNumber(telemetry?.humidity, "%")}</td>
                  <td>{formatNumber(telemetry?.speed, " km/h")}</td>
                  <td className="capitalize">{telemetry?.reefer?.status || "—"}</td>
                  <td><span className={`status-pill status-${truck.status}`}>{truck.status}</span></td>
                  <td><span className="updated-cell">{formatTime(telemetry?.timestamp)}<ChevronRight size={15} aria-hidden="true" /></span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

