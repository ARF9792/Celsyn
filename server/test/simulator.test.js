import { describe, expect, it } from "vitest";
import { trucks } from "../src/data/trucks.js";
import { createTruckSimulator } from "../src/simulator/generator.js";

describe("truck telemetry simulator", () => {
  it("maintains ordered sequences and gradual value changes", () => {
    const simulator = createTruckSimulator(trucks[0], {
      random: () => 0.5,
      anomalyRate: 0,
    });
    const first = simulator.next(new Date("2026-01-01T00:00:00.000Z"));
    const second = simulator.next(new Date("2026-01-01T00:00:00.200Z"));

    expect(second.sequence).toBe(first.sequence + 1);
    expect(second.timestamp).toBe("2026-01-01T00:00:00.200Z");
    expect(Math.abs(second.temperature - first.temperature)).toBeLessThan(1);
    expect(Math.abs(second.location.lat - first.location.lat)).toBeLessThan(0.1);
    expect(second.fuel).toBeLessThan(first.fuel);
    expect(second.reefer.status).toBe("running");
  });

  it("can deterministically trigger a reefer failure", () => {
    const simulator = createTruckSimulator(trucks[0], {
      random: () => 0,
      anomalyRate: 1,
    });

    expect(simulator.next().reefer.status).toBe("failed");
  });
});

