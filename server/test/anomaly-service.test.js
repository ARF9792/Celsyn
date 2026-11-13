import { beforeEach, describe, expect, it } from "vitest";
import {
  evaluateTelemetry,
  listRecentAlerts,
  resetAnomalyState,
} from "../src/services/anomaly-service.js";
import { createTelemetry } from "./fixtures/telemetry.js";

describe("cold-chain anomaly detection", () => {
  beforeEach(() => resetAnomalyState());

  it("classifies critical temperature and reefer failures", () => {
    const alerts = evaluateTelemetry(createTelemetry({
      temperature: 12,
      reefer: { status: "failed", power: 4 },
    }), Date.parse("2026-01-01T00:00:00.000Z"));

    expect(alerts.map((alert) => alert.type)).toEqual([
      "TEMPERATURE_CRITICAL",
      "REEFER_FAILURE",
    ]);
    expect(alerts.every((alert) => alert.severity === "critical")).toBe(true);
  });

  it("does not flood an ongoing incident and emits again after recovery", () => {
    const abnormal = createTelemetry({ temperature: 9 });
    const first = evaluateTelemetry(abnormal, 1_000);
    const repeated = evaluateTelemetry({ ...abnormal, eventId: crypto.randomUUID() }, 2_000);
    evaluateTelemetry(createTelemetry({ temperature: 5 }), 3_000);
    const afterRecovery = evaluateTelemetry(
      createTelemetry({ temperature: 9 }),
      4_000,
    );

    expect(first).toHaveLength(1);
    expect(repeated).toHaveLength(0);
    expect(afterRecovery).toHaveLength(1);
    expect(listRecentAlerts()).toHaveLength(2);
  });

  it("detects an open cargo door while moving and low fuel", () => {
    const alerts = evaluateTelemetry(createTelemetry({
      doorOpen: true,
      speed: 45,
      fuel: 9,
    }));

    expect(alerts.map((alert) => alert.type)).toEqual([
      "DOOR_OPEN_WHILE_MOVING",
      "LOW_FUEL",
    ]);
  });
});

