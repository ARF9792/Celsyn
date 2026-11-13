import { Server } from "socket.io";
import { env } from "../config/env.js";
import { trucksById } from "../data/trucks.js";
import { telemetryEvents } from "../events/telemetry-events.js";
import { getFleetSummary } from "../services/fleet-state.js";

const BROADCAST_INTERVAL_MS = 150;

const compactTruckState = (state) => ({
  eventId: state.eventId,
  sequence: state.sequence,
  truckId: state.truckId,
  timestamp: state.timestamp,
  temperature: state.temperature,
  humidity: state.humidity,
  speed: state.speed,
  fuel: state.fuel,
  doorOpen: state.doorOpen,
  reefer: state.reefer,
  status: state.status,
});

const readTruckId = (payload) =>
  typeof payload === "string" ? payload : payload?.truckId;

export class RealtimeGateway {
  constructor(httpServer, options = {}) {
    this.io = new Server(httpServer, {
      cors: {
        origin: env.clientUrl,
        credentials: true,
      },
    });
    this.broadcastIntervalMs = options.broadcastIntervalMs || BROADCAST_INTERVAL_MS;
    this.pendingByTruck = new Map();
    this.broadcastMessages = 0;
    this.latencyTotalMs = 0;
    this.latencySamples = 0;
    this.queueTelemetry = this.queueTelemetry.bind(this);
    this.handleConnection = this.handleConnection.bind(this);
    telemetryEvents.on("telemetry", this.queueTelemetry);
    this.io.on("connection", this.handleConnection);
    this.timer = setInterval(() => this.flush(), this.broadcastIntervalMs);
    this.timer.unref?.();
  }

  handleConnection(socket) {
    socket.on("subscribe:fleet", (acknowledge = () => {}) => {
      socket.join("fleet");
      acknowledge({ ok: true, room: "fleet" });
    });

    socket.on("unsubscribe:fleet", (acknowledge = () => {}) => {
      socket.leave("fleet");
      acknowledge({ ok: true });
    });

    socket.on("subscribe:alerts", (acknowledge = () => {}) => {
      socket.join("alerts");
      acknowledge({ ok: true, room: "alerts" });
    });

    socket.on("subscribe:truck", (payload, acknowledge = () => {}) => {
      const truckId = readTruckId(payload);
      if (!trucksById.has(truckId)) {
        acknowledge({ ok: false, error: "Unknown truck ID" });
        return;
      }
      socket.join(`truck:${truckId}`);
      acknowledge({ ok: true, room: `truck:${truckId}` });
    });

    socket.on("unsubscribe:truck", (payload, acknowledge = () => {}) => {
      const truckId = readTruckId(payload);
      if (trucksById.has(truckId)) {
        socket.leave(`truck:${truckId}`);
      }
      acknowledge({ ok: true });
    });
  }

  queueTelemetry(state) {
    this.pendingByTruck.set(state.truckId, state);
  }

  flush() {
    if (this.pendingByTruck.size === 0) return;

    const changedStates = [...this.pendingByTruck.values()];
    this.pendingByTruck.clear();

    changedStates.forEach((state) => {
      this.io.to(`truck:${state.truckId}`).emit("truck:update", state);
      this.broadcastMessages += 1;
      this.latencyTotalMs += Math.max(0, Date.now() - Date.parse(state.receivedAt));
      this.latencySamples += 1;
    });

    this.io.to("fleet").emit("fleet:update", {
      timestamp: new Date().toISOString(),
      summary: getFleetSummary(),
      changedTrucks: changedStates.map(compactTruckState),
    });
    this.broadcastMessages += 1;
  }

  emitAlert(alert) {
    this.io.to("alerts").emit("alert:new", alert);
    this.broadcastMessages += 1;
  }

  emitSystemMetrics(metrics) {
    this.io.emit("system:metrics", metrics);
    this.broadcastMessages += 1;
  }

  getStats() {
    return {
      connectedClients: this.io.engine.clientsCount,
      broadcastMessages: this.broadcastMessages,
      averageBroadcastLatencyMs: this.latencySamples > 0
        ? Number((this.latencyTotalMs / this.latencySamples).toFixed(2))
        : 0,
    };
  }

  stop() {
    clearInterval(this.timer);
    telemetryEvents.off("telemetry", this.queueTelemetry);
    this.io.disconnectSockets(true);
    this.io.removeAllListeners();
  }
}

