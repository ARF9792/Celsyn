import { describe, expect, it } from "vitest";
import { telemetrySchema } from "../src/schemas/telemetry.js";
import { createTelemetry } from "./fixtures/telemetry.js";

describe("telemetry schema", () => {
  it("accepts a complete cold-chain event", () => {
    expect(telemetrySchema.safeParse(createTelemetry()).success).toBe(true);
  });

  it("rejects out-of-range and malformed values", () => {
    const result = telemetrySchema.safeParse(createTelemetry({
      humidity: 140,
      location: { lat: 100, lng: 72.8 },
    }));

    expect(result.success).toBe(false);
    expect(result.error.issues.map((issue) => issue.path.join("."))).toEqual(
      expect.arrayContaining(["humidity", "location.lat"]),
    );
  });
});

