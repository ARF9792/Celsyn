export default function ConnectionBadge({ status }) {
  return (
    <span className={`connection-badge connection-${status}`}>
      <span className="connection-dot" />
      {status}
    </span>
  );
}

