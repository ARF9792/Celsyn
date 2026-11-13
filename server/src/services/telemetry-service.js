import { trucksById } from "../data/trucks.js";
import { telemetryEvents } from "../events/telemetry-events.js";
import { evaluateTelemetry } from "./anomaly-service.js";
import { applyDemoScenario } from "./demo-scenarios.js";
import { updateFleetState } from "./fleet-state.js";
import { telemetryPersistence } from "./telemetry-persistence.js";

export const ingestTelemetry = (telemetry) => {
  if (!trucksById.has(telemetry.truckId)) {
    return { accepted: false, reason: "UNKNOWN_TRUCK" };
  }

  const processedTelemetry = applyDemoScenario(telemetry, trucksById.get(telemetry.truckId));
  const result = updateFleetState(processedTelemetry);
  if (result.accepted) {
    telemetryPersistence.enqueue(result.state);
    telemetryEvents.emit("telemetry", result.state);
    evaluateTelemetry(result.state);
  }
  return result;
};

