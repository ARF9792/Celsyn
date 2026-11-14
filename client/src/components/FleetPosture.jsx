import { ArrowUpRight, CheckCircle2, ShieldAlert, Siren } from "lucide-react";
import { Link } from "react-router-dom";

const getPosture = (summary) => {
  if (summary.criticalTrucks > 0) {
    return {
      tone: "critical",
      Icon: Siren,
      label: "Immediate action required",
      headline: `${summary.criticalTrucks} critical ${summary.criticalTrucks === 1 ? "vehicle" : "vehicles"}`,
      detail: `${summary.warningTrucks} additional ${summary.warningTrucks === 1 ? "warning" : "warnings"} in the fleet.`,
    };
  }
  if (summary.warningTrucks > 0) {
    return {
      tone: "warning",
      Icon: ShieldAlert,
      label: "Operator review required",
      headline: `${summary.warningTrucks} ${summary.warningTrucks === 1 ? "vehicle needs" : "vehicles need"} review`,
      detail: "No critical vehicles are currently reported.",
    };
  }
  return {
    tone: "healthy",
    Icon: CheckCircle2,
    label: "Fleet within operating limits",
    headline: "No active safety exceptions",
    detail: `${summary.healthyTrucks} vehicles are currently within their configured range.`,
  };
};

export default function FleetPosture({ summary }) {
  const total = Math.max(summary.totalTrucks || 0, 1);
  const posture = getPosture(summary);
  const PostureIcon = posture.Icon;
  const affected = summary.warningTrucks + summary.criticalTrucks;
  const actionLabel = affected > 0 ? "Review affected vehicles" : "Open live fleet";

  return (
    <section className={`fleet-posture posture-${posture.tone}`} aria-labelledby="fleet-posture-title">
      <div className="posture-message">
        <span className="posture-icon" aria-hidden="true"><PostureIcon size={22} strokeWidth={1.8} /></span>
        <div>
          <p className="section-label">{posture.label}</p>
          <h2 id="fleet-posture-title">{posture.headline}</h2>
          <p className="posture-detail">{posture.detail}</p>
        </div>
        <Link className="text-action" to="/app/fleet">{actionLabel}<ArrowUpRight size={16} aria-hidden="true" /></Link>
      </div>

      <div className="posture-data">
        <div className="posture-counts" aria-label="Fleet safety distribution">
          <div><span>Healthy</span><strong>{summary.healthyTrucks}</strong></div>
          <div><span>Warning</span><strong>{summary.warningTrucks}</strong></div>
          <div><span>Critical</span><strong>{summary.criticalTrucks}</strong></div>
        </div>
        <div className="posture-track" aria-hidden="true">
          <span className="track-healthy" style={{ width: `${(summary.healthyTrucks / total) * 100}%` }} />
          <span className="track-warning" style={{ width: `${(summary.warningTrucks / total) * 100}%` }} />
          <span className="track-critical" style={{ width: `${(summary.criticalTrucks / total) * 100}%` }} />
        </div>
        <p>{summary.onlineTrucks} of {summary.totalTrucks} vehicles reporting</p>
      </div>
    </section>
  );
}
