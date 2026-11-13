import { trucks, trucksById } from "../data/trucks.js";

const latestByTruck = new Map();
const ONLINE_WINDOW_MS = 30_000;

const classifyStatus = (truck, telemetry) => {
  if (!telemetry) return "offline";
  if (telemetry.reefer.status === "failed") return "critical";

  const { min, max } = truck.safeTemperature;
  const distanceOutsideRange = Math.max(
    min - telemetry.temperature,
    telemetry.temperature - max,
    0,
  );

  if (distanceOutsideRange >= 3) return "critical";
  if (distanceOutsideRange > 0 || telemetry.fuel < 15) return "warning";
  return "healthy";
};

const isOnline = (telemetry, now = Date.now()) =>
  Boolean(telemetry && now - Date.parse(telemetry.timestamp) <= ONLINE_WINDOW_MS);

export const updateFleetState = (telemetry) => {
  const truck = trucksById.get(telemetry.truckId);
  const previous = latestByTruck.get(telemetry.truckId);

  if (previous && telemetry.sequence <= previous.sequence) {
    return { accepted: false, reason: "STALE_SEQUENCE", state: previous };
  }

  const state = Object.freeze({
    ...telemetry,
    status: classifyStatus(truck, telemetry),
    receivedAt: new Date().toISOString(),
  });

  latestByTruck.set(telemetry.truckId, state);
  return { accepted: true, state };
};

export const getTruckSnapshot = (truckId, now = Date.now()) => {
  const truck = trucksById.get(truckId);
  if (!truck) return null;

  const latestTelemetry = latestByTruck.get(truckId) || null;
  return {
    ...truck,
    latestTelemetry,
    status: latestTelemetry ? latestTelemetry.status : "offline",
    online: isOnline(latestTelemetry, now),
  };
};

export const getFleetSnapshots = (now = Date.now()) =>
  trucks.map((truck) => getTruckSnapshot(truck.truckId, now));

export const getFleetSummary = (now = Date.now()) => {
  const snapshots = getFleetSnapshots(now);
  return snapshots.reduce(
    (summary, truck) => {
      summary.totalTrucks += 1;
      if (truck.online) summary.onlineTrucks += 1;
      if (truck.status === "healthy") summary.healthyTrucks += 1;
      if (truck.status === "warning") summary.warningTrucks += 1;
      if (truck.status === "critical") summary.criticalTrucks += 1;
      return summary;
    },
    {
      totalTrucks: 0,
      onlineTrucks: 0,
      healthyTrucks: 0,
      warningTrucks: 0,
      criticalTrucks: 0,
    },
  );
};

export const resetFleetState = () => latestByTruck.clear();

