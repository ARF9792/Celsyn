import { env } from "../config/env.js";
import { TelemetryEvent } from "../models/TelemetryEvent.js";

export class TelemetryPersistenceBuffer {
  constructor({
    model = TelemetryEvent,
    flushIntervalMs = env.telemetryFlushIntervalMs,
    maxBatchSize = env.telemetryMaxBatchSize,
  } = {}) {
    this.model = model;
    this.flushIntervalMs = flushIntervalMs;
    this.maxBatchSize = maxBatchSize;
    this.buffer = [];
    this.timer = null;
    this.flushPromise = null;
    this.persistedEvents = 0;
    this.duplicateEvents = 0;
  }

  start() {
    if (this.timer) return;
    this.timer = setInterval(() => void this.flush(), this.flushIntervalMs);
    this.timer.unref?.();
  }

  enqueue(event) {
    if (!this.timer) return false;
    this.buffer.push(event);
    if (this.buffer.length >= this.maxBatchSize) {
      void this.flush();
    }
    return true;
  }

  async flush() {
    if (this.flushPromise) return this.flushPromise;
    if (this.buffer.length === 0) return { persisted: 0, duplicates: 0 };

    const batch = this.buffer.splice(0, this.maxBatchSize);
    this.flushPromise = this.persistBatch(batch);

    try {
      return await this.flushPromise;
    } finally {
      this.flushPromise = null;
      if (this.buffer.length >= this.maxBatchSize) {
        void this.flush();
      }
    }
  }

  async persistBatch(batch) {
    try {
      const documents = await this.model.insertMany(batch, { ordered: false });
      this.persistedEvents += documents.length;
      return { persisted: documents.length, duplicates: 0 };
    } catch (error) {
      const writeErrors = error.writeErrors || [];
      const duplicateCount = writeErrors.filter((entry) => entry.code === 11000).length;
      const nonDuplicateErrors = writeErrors.filter((entry) => entry.code !== 11000);

      if (nonDuplicateErrors.length > 0 || (duplicateCount === 0 && error.code !== 11000)) {
        this.buffer.unshift(...batch);
        console.error(JSON.stringify({
          level: "error",
          message: "Telemetry persistence flush failed",
          error: error.message,
        }));
        return { persisted: 0, duplicates: 0, failed: batch.length };
      }

      const persisted = error.result?.insertedCount ?? Math.max(0, batch.length - duplicateCount);
      this.persistedEvents += persisted;
      this.duplicateEvents += duplicateCount;
      return { persisted, duplicates: duplicateCount };
    }
  }

  async stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }

    while (this.buffer.length > 0 || this.flushPromise) {
      await this.flush();
      if (this.flushPromise) await this.flushPromise;
    }
  }

  getStats() {
    return {
      bufferedEvents: this.buffer.length,
      persistedEvents: this.persistedEvents,
      duplicateEvents: this.duplicateEvents,
    };
  }
}

export const telemetryPersistence = new TelemetryPersistenceBuffer();

