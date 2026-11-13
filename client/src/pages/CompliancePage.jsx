import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { api } from "../services/api.js";
import { formatDuration, formatNumber, formatTime } from "../utils/telemetry.js";

export default function CompliancePage() {
  const dashboard = useOutletContext();
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!dashboard.selectedTruckId) return;
    let active = true;
    setLoading(true);
    setError("");
    api.getTruckCompliance(dashboard.selectedTruckId)
      .then((result) => { if (active) setPayload(result); })
      .catch((requestError) => { if (active) setError(requestError.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [dashboard.selectedTruckId]);

  const analytics = payload?.analytics;
  const worst = analytics?.temperature?.worstDeviation;

  return (
    <div className="page-stack">
      <section className="panel compliance-toolbar">
        <div><p className="section-kicker">Selected asset</p><h2>Cold-chain compliance</h2></div>
        <label>
          Truck
          <select value={dashboard.selectedTruckId || ""} onChange={(event) => dashboard.selectTruck(event.target.value)}>
            {dashboard.trucks.map((truck) => <option value={truck.truckId} key={truck.truckId}>{truck.truckId} — {truck.cargoType}</option>)}
          </select>
        </label>
      </section>

      {error && <div className="error-banner">{error}</div>}
      {loading && <section className="panel loading-panel">Calculating compliance from MongoDB history…</section>}

      {!loading && analytics && (
        <>
          <section className="summary-card-grid">
            <article className="summary-card summary-compliance"><span>Compliance</span><strong>{analytics.compliancePercentage ?? "—"}%</strong><small>time within safe range</small></article>
            <article className="summary-card"><span>Excursions</span><strong>{analytics.excursionCount}</strong><small>detected periods</small></article>
            <article className="summary-card summary-warning"><span>Out of range</span><strong>{formatDuration(analytics.outOfRangeDurationMs)}</strong><small>observed duration</small></article>
            <article className="summary-card summary-critical"><span>Worst deviation</span><strong>{worst ? formatNumber(worst.amount, "°C") : "None"}</strong><small>{worst?.direction || "all samples compliant"}</small></article>
          </section>

          <div className="compliance-grid">
            <section className="panel">
              <div className="panel-heading"><div><p className="section-kicker">Temperature profile</p><h2>Observed statistics</h2></div></div>
              <div className="detail-grid">
                <div className="detail-item"><span>Minimum</span><strong>{formatNumber(analytics.temperature.minimum, "°C")}</strong></div>
                <div className="detail-item"><span>Maximum</span><strong>{formatNumber(analytics.temperature.maximum, "°C")}</strong></div>
                <div className="detail-item"><span>Average</span><strong>{formatNumber(analytics.temperature.average, "°C")}</strong></div>
                <div className="detail-item"><span>Samples</span><strong>{analytics.sampleCount.toLocaleString()}</strong></div>
              </div>
            </section>

            <section className="panel">
              <div className="panel-heading"><div><p className="section-kicker">Excursion history</p><h2>Recent excursions</h2></div></div>
              <div className="excursion-list">
                {analytics.excursions.length === 0 && <p className="empty-copy">No temperature excursions in this window.</p>}
                {analytics.excursions.map((excursion) => (
                  <article className="excursion-item" key={`${excursion.startTimestamp}-${excursion.endTimestamp}`}>
                    <span className={`status-pill status-${excursion.severity}`}>{excursion.severity}</span>
                    <div><strong>{formatDuration(excursion.durationMs)}</strong><small>{formatTime(excursion.startTimestamp)} · {excursion.directions.join(" / ")}</small></div>
                  </article>
                ))}
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
}

