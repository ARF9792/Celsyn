import { Radio } from "lucide-react";

const labels = {
  connected: "Live telemetry",
  connecting: "Connecting",
  reconnecting: "Reconnecting",
  disconnected: "Offline",
};

export default function ConnectionBadge({ status }) {
  return (
    <span className={`connection-badge connection-${status}`} role="status">
      <span className="connection-signal" aria-hidden="true"><Radio size={14} /></span>
      {labels[status] || status}
    </span>
  );
}

