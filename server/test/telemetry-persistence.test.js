import { describe, expect, it, vi } from "vitest";
import { TelemetryPersistenceBuffer } from "../src/services/telemetry-persistence.js";
import { createTelemetry } from "./fixtures/telemetry.js";

describe("telemetry persistence buffer", () => {
  it("flushes queued events in a single unordered insert", async () => {
    const insertMany = vi.fn().mockResolvedValue([{}, {}]);
    const buffer = new TelemetryPersistenceBuffer({
      model: { insertMany },
      flushIntervalMs: 60_000,
      maxBatchSize: 500,
    });

    buffer.start();
    buffer.enqueue(createTelemetry({ sequence: 1 }));
    buffer.enqueue(createTelemetry({ sequence: 2 }));
    const result = await buffer.flush();
    await buffer.stop();

    expect(insertMany).toHaveBeenCalledOnce();
    expect(insertMany).toHaveBeenCalledWith(expect.any(Array), { ordered: false });
    expect(result).toEqual({ persisted: 2, duplicates: 0 });
  });

  it("treats duplicate keys as a handled deduplication outcome", async () => {
    const duplicateError = Object.assign(new Error("duplicate key"), {
      code: 11000,
      writeErrors: [{ code: 11000 }],
      result: { insertedCount: 1 },
    });
    const buffer = new TelemetryPersistenceBuffer({
      model: { insertMany: vi.fn().mockRejectedValue(duplicateError) },
    });

    const result = await buffer.persistBatch([
      createTelemetry({ sequence: 1 }),
      createTelemetry({ sequence: 2 }),
    ]);

    expect(result).toEqual({ persisted: 1, duplicates: 1 });
    expect(buffer.getStats()).toMatchObject({ persistedEvents: 1, duplicateEvents: 1 });
  });
});

