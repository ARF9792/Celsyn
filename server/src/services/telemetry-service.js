import { trucksById } from "../data/trucks.js";
import { updateFleetState } from "./fleet-state.js";

export const ingestTelemetry = (telemetry) => {
  if (!trucksById.has(telemetry.truckId)) {
    return { accepted: false, reason: "UNKNOWN_TRUCK" };
  }

  return updateFleetState(telemetry);
};

