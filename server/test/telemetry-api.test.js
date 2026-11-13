import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { resetFleetState } from "../src/services/fleet-state.js";
import { pipelineMetrics } from "../src/services/pipeline-metrics.js";
import { createTelemetry } from "./fixtures/telemetry.js";

describe("telemetry ingestion API", () => {
  beforeEach(() => {
    resetFleetState();
    pipelineMetrics.reset();
  });

  it("ingests an event and exposes the updated truck state", async () => {
    const app = createApp();
    const event = createTelemetry();

    const ingestion = await request(app).post("/api/telemetry").send(event);
    const truck = await request(app).get("/api/trucks/TRK-001");
    const summary = await request(app).get("/api/fleet/summary");

    expect(ingestion.status).toBe(202);
    expect(truck.body.truck.latestTelemetry.eventId).toBe(event.eventId);
    expect(truck.body.truck.status).toBe("healthy");
    expect(summary.body.summary).toMatchObject({
      totalTrucks: 25,
      onlineTrucks: 1,
      healthyTrucks: 1,
    });
  });

  it("accepts valid batch entries and reports invalid entries", async () => {
    const response = await request(createApp())
      .post("/api/telemetry/batch")
      .send([
        createTelemetry(),
        createTelemetry({ truckId: "TRK-999" }),
        { truckId: "missing-fields" },
      ]);

    expect(response.status).toBe(202);
    expect(response.body).toMatchObject({ accepted: 1, rejected: 2 });
    expect(response.body.errors.map((error) => error.code)).toEqual([
      "UNKNOWN_TRUCK",
      "VALIDATION_ERROR",
    ]);
  });

  it("rejects stale sequence numbers", async () => {
    const app = createApp();
    await request(app).post("/api/telemetry").send(createTelemetry({ sequence: 10 }));
    const response = await request(app)
      .post("/api/telemetry")
      .send(createTelemetry({ sequence: 9 }));

    expect(response.status).toBe(409);
    expect(response.body.code).toBe("STALE_SEQUENCE");
  });

  it("reports actual ingestion counters", async () => {
    const app = createApp();
    await request(app).post("/api/telemetry").send(createTelemetry());
    await request(app).post("/api/telemetry").send({ invalid: true });

    const response = await request(app).get("/api/system/metrics");
    expect(response.body.metrics).toMatchObject({
      eventsReceivedTotal: 2,
      validEvents: 1,
      rejectedEvents: 1,
      droppedEvents: 0,
    });
  });
});

