import { formatNumber, formatTime } from "../utils/telemetry.js";

export default function FleetTable({ trucks, selectedTruckId, onSelect }) {
  return (
    <section className="panel fleet-panel">
      <div className="panel-heading">
        <div>
          <p className="section-kicker">Live state</p>
          <h2>Fleet overview</h2>
        </div>
        <span className="record-count">{trucks.length} trucks</span>
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
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") onSelect(truck.truckId);
                  }}
                >
                  <td><strong>{truck.truckId}</strong><small>{truck.displayName}</small></td>
                  <td>{formatNumber(telemetry?.temperature, "°C")}</td>
                  <td>{formatNumber(telemetry?.humidity, "%")}</td>
                  <td>{formatNumber(telemetry?.speed, " km/h")}</td>
                  <td className="capitalize">{telemetry?.reefer?.status || "—"}</td>
                  <td><span className={`status-pill status-${truck.status}`}>{truck.status}</span></td>
                  <td>{formatTime(telemetry?.timestamp)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

