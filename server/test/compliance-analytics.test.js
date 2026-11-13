import { describe, expect, it } from "vitest";
import { trucks } from "../src/data/trucks.js";
import { calculateComplianceAnalytics } from "../src/services/compliance-analytics.js";

const from = new Date("2026-01-01T00:00:00.000Z");
const to = new Date("2026-01-01T00:00:50.000Z");

const event = (seconds, temperature, sequence) => ({
  eventId: `event-${sequence}`,
  sequence,
  timestamp: new Date(from.getTime() + seconds * 1_000),
  temperature,
});

describe("cold-chain compliance analytics", () => {
  it("calculates time-weighted compliance and contiguous excursions", () => {
    const analytics = calculateComplianceAnalytics([
      event(0, 5, 1),
      event(10, 9, 2),
      event(20, 12, 3),
      event(30, 5, 4),
      event(40, 1, 5),
    ], trucks[0], { from, to });

    expect(analytics).toMatchObject({
      sampleCount: 5,
      compliantSamples: 2,
      outOfRangeSamples: 3,
      observedDurationMs: 50_000,
      compliantDurationMs: 20_000,
      outOfRangeDurationMs: 30_000,
      compliancePercentage: 40,
      excursionCount: 2,
    });
    expect(analytics.temperature).toMatchObject({
      minimum: 1,
      maximum: 12,
      average: 6.4,
      worstDeviation: {
        amount: 4,
        direction: "above",
        temperature: 12,
      },
    });
    expect(analytics.excursions).toHaveLength(2);
    expect(analytics.excursions[0]).toMatchObject({
      durationMs: 10_000,
      severity: "warning",
      ongoing: true,
    });
    expect(analytics.excursions[1]).toMatchObject({
      durationMs: 20_000,
      severity: "critical",
      ongoing: false,
    });
  });

  it("returns a clear empty result when no telemetry exists", () => {
    const analytics = calculateComplianceAnalytics([], trucks[0], { from, to });

    expect(analytics).toMatchObject({
      sampleCount: 0,
      compliancePercentage: null,
      excursionCount: 0,
      excursions: [],
      temperature: { minimum: null, maximum: null, average: null },
    });
  });

  it("caps attribution across long telemetry gaps", () => {
    const analytics = calculateComplianceAnalytics([
      event(0, 12, 1),
      event(300, 5, 2),
    ], trucks[0], {
      from,
      to: new Date(from.getTime() + 360_000),
    });

    expect(analytics.observedDurationMs).toBe(120_000);
    expect(analytics.outOfRangeDurationMs).toBe(60_000);
    expect(analytics.compliancePercentage).toBe(50);
  });
});

