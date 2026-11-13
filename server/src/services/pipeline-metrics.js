import { telemetryPersistence } from "./telemetry-persistence.js";

class PipelineMetrics {
  constructor() {
    this.realtimeGateway = null;
    this.reset();
  }

  reset() {
    this.startedAt = Date.now();
    this.eventsReceivedTotal = 0;
    this.validEvents = 0;
    this.rejectedEvents = 0;
    this.droppedEvents = 0;
    this.acceptedTimestamps = [];
  }

  recordReceived(count = 1) {
    this.eventsReceivedTotal += count;
  }

  recordAccepted(count = 1, now = Date.now()) {
    this.validEvents += count;
    for (let index = 0; index < count; index += 1) {
      this.acceptedTimestamps.push(now);
    }
    this.prune(now);
  }

  recordRejected(count = 1) {
    this.rejectedEvents += count;
  }

  recordDropped(count = 1) {
    this.droppedEvents += count;
  }

  prune(now = Date.now()) {
    const threshold = now - 1_000;
    let firstRecentIndex = 0;
    while (
      firstRecentIndex < this.acceptedTimestamps.length
      && this.acceptedTimestamps[firstRecentIndex] < threshold
    ) {
      firstRecentIndex += 1;
    }
    if (firstRecentIndex > 0) {
      this.acceptedTimestamps.splice(0, firstRecentIndex);
    }
  }

  attachRealtimeGateway(gateway) {
    this.realtimeGateway = gateway;
  }

  detachRealtimeGateway(gateway) {
    if (this.realtimeGateway === gateway) this.realtimeGateway = null;
  }

  getSnapshot(now = Date.now()) {
    this.prune(now);
    const realtime = this.realtimeGateway?.getStats(now) || {
      connectedClients: 0,
      broadcastMessages: 0,
      broadcastMessagesPerSecond: 0,
      averageBroadcastLatencyMs: 0,
      coalescedEvents: 0,
    };

    return {
      timestamp: new Date(now).toISOString(),
      uptimeSeconds: Number(((now - this.startedAt) / 1_000).toFixed(1)),
      eventsReceivedTotal: this.eventsReceivedTotal,
      currentEventsPerSecond: this.acceptedTimestamps.length,
      validEvents: this.validEvents,
      rejectedEvents: this.rejectedEvents,
      droppedEvents: this.droppedEvents,
      ...realtime,
      mongo: telemetryPersistence.getStats(),
    };
  }
}

export const pipelineMetrics = new PipelineMetrics();

