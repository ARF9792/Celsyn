export const mergeTelemetryPoints = (existing, incoming, limit = 300) => {
  const byEventId = new Map();
  [...existing, ...incoming].forEach((event) => {
    if (event?.eventId) byEventId.set(event.eventId, event);
  });

  return [...byEventId.values()]
    .sort((left, right) => {
      const timestampDifference = Date.parse(left.timestamp) - Date.parse(right.timestamp);
      return timestampDifference || left.sequence - right.sequence;
    })
    .slice(-limit);
};

export const formatTime = (timestamp) => {
  if (!timestamp) return "—";
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(timestamp));
};

export const formatNumber = (value, suffix = "", digits = 1) =>
  Number.isFinite(value) ? `${value.toFixed(digits)}${suffix}` : "—";

