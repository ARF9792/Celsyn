import { CalendarRange, CheckCircle2, Clock3, Thermometer, TriangleAlert } from "lucide-react";
import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { api } from "../services/api.js";
import { formatDateTime, formatDuration, formatNumber } from "../utils/telemetry.js";

const windows = [
  { value: 60, label: "Last 60 minutes" },
  { value: 360, label: "Last 6 hours" },
  { value: 1440, label: "Last 24 hours" },
];

export default function CompliancePage() {
  const dashboard = useOutletContext();
  const [minutes, setMinutes] = useState(60);
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!dashboard.selectedTruckId) return undefined;
    let active = true;
    setLoading(true);
    setError("");
    api.getTruckCompliance(dashboard.selectedTruckId, minutes)
      .then((result) => { if (active) setPayload(result); })
      .catch((requestError) => { if (active) setError(requestError.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [dashboard.selectedTruckId, minutes]);

  const analytics = payload?.analytics;
  const truck = dashboard.selectedTruck;
  const worst = analytics?.temperature?.worstDeviation;
  const compliance = analytics?.compliancePercentage;
  const safeRange = truck ? `${truck.safeTemperature.min}–${truck.safeTemperature.max}°C` : "—";
  const profileValues = analytics && truck
    ? [analytics.temperature.minimum, analytics.temperature.maximum, truck.safeTemperature.min, truck.safeTemperature.max].filter(Number.isFinite)
    : [];
  const profileMinimum = profileValues.length ? Math.min(...profileValues) : 0;
  const profileMaximum = profileValues.length ? Math.max(...profileValues) : 1;
  const profileSpan = Math.max(1, profileMaximum - profileMinimum);
  const profilePosition = (value) => `${Math.max(0, Math.min(100, ((value - profileMinimum) / profileSpan) * 100))}%`;

  return (
    <div className="page-stack compliance-page" data-enter>
      <section className="panel compliance-toolbar">
        <div><p className="section-kicker">Stored telemetry analysis</p><h2>Cold-chain compliance</h2><p>Time in range, excursion duration and temperature extremes for one refrigerated truck.</p></div>
        <div className="compliance-controls">
          <label>Truck<select value={dashboard.selectedTruckId || ""} onChange={(event) => dashboard.selectTruck(event.target.value)}>{dashboard.trucks.map((item) => <option value={item.truckId} key={item.truckId}>{item.truckId} — {item.cargoType}</option>)}</select></label>
          <label>Window<select value={minutes} onChange={(event) => setMinutes(Number(event.target.value))}>{windows.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}</select></label>
        </div>
      </section>

      {error && <div className="error-banner" role="alert">{error}</div>}
      {loading && <section className="panel loading-panel">Calculating compliance from MongoDB history…</section>}

      {!loading && analytics && (
        <>
          <section className={`compliance-posture ${compliance != null && compliance < 100 ? "has-excursions" : "is-compliant"}`}>
            <div>
              <p className="section-kicker">{truck?.truckId} · safe range {safeRange}</p>
              <h2>{compliance == null ? "No observed duration in this window" : `${compliance}% of observed time remained in range`}</h2>
              <p>{analytics.sampleCount.toLocaleString()} stored samples between {formatDateTime(analytics.analyzedFrom)} and {formatDateTime(analytics.analyzedTo)}.</p>
            </div>
            <div className="compliance-posture-score"><strong>{compliance == null ? "—" : `${compliance}%`}</strong><span>time compliant</span></div>
            <div className="compliance-track compliance-track-large" aria-label={`${compliance ?? 0}% compliant`}><span style={{ width: `${Math.max(0, Math.min(100, compliance ?? 0))}%` }} /></div>
          </section>

          <section className="compliance-kpis" aria-label="Compliance summary">
            <article><CheckCircle2 size={19} /><span>Compliant time</span><strong>{formatDuration(analytics.compliantDurationMs)}</strong></article>
            <article><Clock3 size={19} /><span>Out of range</span><strong>{formatDuration(analytics.outOfRangeDurationMs)}</strong></article>
            <article><TriangleAlert size={19} /><span>Excursions</span><strong>{analytics.excursionCount}</strong></article>
            <article><Thermometer size={19} /><span>Worst deviation</span><strong>{worst ? formatNumber(worst.amount, "°C") : "None"}</strong></article>
          </section>

          <div className="compliance-grid compliance-detail-grid">
            <section className="panel temperature-profile">
              <div className="panel-heading"><div><p className="section-kicker">Temperature profile</p><h2>Observed statistics</h2></div><span className="record-count">{analytics.sampleCount.toLocaleString()} samples</span></div>
              <div
                className="temperature-range-visual"
                role="img"
                aria-label={`Minimum ${analytics.temperature.minimum} degrees, average ${analytics.temperature.average} degrees, maximum ${analytics.temperature.maximum} degrees`}
                style={{
                  "--safe-start": profilePosition(truck.safeTemperature.min),
                  "--safe-width": `${Math.max(2, ((truck.safeTemperature.max - truck.safeTemperature.min) / profileSpan) * 100)}%`,
                  "--average-position": profilePosition(analytics.temperature.average ?? profileMinimum),
                }}
              >
                <div className="temperature-range-line"><span className="temperature-safe-zone" /><i className="temperature-average-mark" /></div>
                <div className="temperature-range-labels"><span>{formatNumber(analytics.temperature.minimum, "°C")}<small>Minimum</small></span><span>{formatNumber(analytics.temperature.average, "°C")}<small>Average</small></span><span>{formatNumber(analytics.temperature.maximum, "°C")}<small>Maximum</small></span></div>
              </div>
              <dl className="compliance-facts">
                <div><dt>Safe range</dt><dd>{safeRange}</dd></div>
                <div><dt>Observed duration</dt><dd>{formatDuration(analytics.observedDurationMs)}</dd></div>
                <div><dt>Out-of-range samples</dt><dd>{analytics.outOfRangeSamples.toLocaleString()}</dd></div>
                <div><dt>Maximum sample gap</dt><dd>{formatDuration(analytics.maximumAttributedSampleGapMs)}</dd></div>
              </dl>
            </section>

            <section className="panel excursion-panel">
              <div className="panel-heading"><div><p className="section-kicker">Newest first</p><h2>Excursion timeline</h2></div><span className="record-count">{analytics.excursions.length} shown</span></div>
              <div className="excursion-timeline">
                {analytics.excursions.length === 0 && <p className="empty-copy">No temperature excursions were detected in this window.</p>}
                {analytics.excursions.map((excursion) => (
                  <article className={`excursion-event excursion-${excursion.severity}`} key={`${excursion.startTimestamp}-${excursion.endTimestamp}`}>
                    <span className="excursion-dot" aria-hidden="true" />
                    <div>
                      <div className="excursion-event-head"><strong>{formatDuration(excursion.durationMs)}</strong><span className={`status-pill status-${excursion.severity}`}>{excursion.ongoing ? "ongoing" : excursion.severity}</span></div>
                      <p>{formatDateTime(excursion.startTimestamp)} · {excursion.directions.join(" / ")}</p>
                      <small>{excursion.sampleCount} samples · maximum deviation {formatNumber(excursion.maximumDeviation, "°C")}</small>
                    </div>
                  </article>
                ))}
              </div>
              {analytics.excursionsTruncated && <p className="data-note"><CalendarRange size={15} />Only the 50 most recent excursions are shown.</p>}
            </section>
          </div>
        </>
      )}

      {!loading && analytics && analytics.sampleCount === 0 && <section className="panel empty-panel">No stored telemetry falls inside the selected time window.</section>}
    </div>
  );
}
