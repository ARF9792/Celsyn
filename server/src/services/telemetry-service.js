import { trucksById } from "../data/trucks.js";
import { telemetryEvents } from "../events/telemetry-events.js";
import { updateFleetState } from "./fleet-state.js";
import { telemetryPersistence } from "./telemetry-persistence.js";

export const ingestTelemetry = (telemetry) => {
  if (!trucksById.has(telemetry.truckId)) {
    return { accepted: false, reason: "UNKNOWN_TRUCK" };
  }

  const result = updateFleetState(telemetry);
  if (result.accepted) {
    telemetryPersistence.enqueue(result.state);
    telemetryEvents.emit("telemetry", result.state);
  }
  return result;
};

