import { randomUUID } from "node:crypto";
import { isDatabaseConnected } from "../config/database.js";
import { trucksById } from "../data/trucks.js";
import { alertEvents } from "../events/alert-events.js";
import { Alert } from "../models/Alert.js";

const INCIDENT_COOLDOWN_MS = 60_000;
const activeIncidents = new Map();
const recentAlerts = [];

const buildCandidate = (type, severity, message, details = {}) => ({
  type,
  severity,
  message,
  details,
});

const detectCandidates = (telemetry, truck) => {
  const candidates = [];
  const { min, max } = truck.safeTemperature;
  const distanceOutsideRange = Math.max(
    min - telemetry.temperature,
    telemetry.temperature - max,
    0,
  );

  if (distanceOutsideRange >= 3) {
    candidates.push(buildCandidate(
      "TEMPERATURE_CRITICAL",
      "critical",
      `${truck.displayName} temperature is critically outside its safe range`,
      { temperature: telemetry.temperature, safeRange: truck.safeTemperature },
    ));
  } else if (distanceOutsideRange > 0) {
    candidates.push(buildCandidate(
      "TEMPERATURE_WARNING",
      "warning",
      `${truck.displayName} temperature is outside its safe range`,
      { temperature: telemetry.temperature, safeRange: truck.safeTemperature },
    ));
  }

  if (telemetry.reefer.status === "failed") {
    candidates.push(buildCandidate(
      "REEFER_FAILURE",
      "critical",
      `${truck.displayName} refrigeration unit has failed`,
      { reeferPower: telemetry.reefer.power },
    ));
  }

  if (telemetry.doorOpen && telemetry.speed > 10) {
    candidates.push(buildCandidate(
      "DOOR_OPEN_WHILE_MOVING",
      "warning",
      `${truck.displayName} cargo door is open while moving`,
      { speed: telemetry.speed },
    ));
  }

  if (telemetry.fuel < 15) {
    candidates.push(buildCandidate(
      "LOW_FUEL",
      "warning",
      `${truck.displayName} fuel level is low`,
      { fuel: telemetry.fuel },
    ));
  }

  return candidates;
};

const persistAlert = (alert) => {
  if (!isDatabaseConnected()) return;
  void Alert.create(alert).catch((error) => {
    console.error(JSON.stringify({
      level: "error",
      message: "Failed to persist alert",
      error: error.message,
      alertId: alert.alertId,
    }));
  });
};

export const evaluateTelemetry = (telemetry, now = Date.now()) => {
  const truck = trucksById.get(telemetry.truckId);
  if (!truck) return [];

  const candidates = detectCandidates(telemetry, truck);
  const currentTypes = new Set(candidates.map((candidate) => candidate.type));

  for (const key of activeIncidents.keys()) {
    const [truckId, type] = key.split(":");
    if (truckId === telemetry.truckId && !currentTypes.has(type)) {
      activeIncidents.delete(key);
    }
  }

  const emitted = [];
  candidates.forEach((candidate) => {
    const key = `${telemetry.truckId}:${candidate.type}`;
    const lastAlertAt = activeIncidents.get(key);
    if (lastAlertAt && now - lastAlertAt < INCIDENT_COOLDOWN_MS) return;

    activeIncidents.set(key, now);
    const alert = {
      alertId: randomUUID(),
      ...candidate,
      truckId: telemetry.truckId,
      timestamp: new Date(now).toISOString(),
      sourceEventId: telemetry.eventId,
    };
    recentAlerts.unshift(alert);
    recentAlerts.splice(200);
    alertEvents.emit("alert", alert);
    persistAlert(alert);
    emitted.push(alert);
  });

  return emitted;
};

export const listRecentAlerts = ({ limit = 50, truckId, severity } = {}) =>
  recentAlerts
    .filter((alert) => (!truckId || alert.truckId === truckId) && (!severity || alert.severity === severity))
    .slice(0, limit);

export const resetAnomalyState = () => {
  activeIncidents.clear();
  recentAlerts.splice(0);
};

