import { randomUUID } from "node:crypto";

export const createTelemetry = (overrides = {}) => ({
  eventId: randomUUID(),
  sequence: 1,
  truckId: "TRK-001",
  timestamp: new Date().toISOString(),
  location: { lat: 19.076, lng: 72.8777 },
  temperature: 4.2,
  humidity: 68,
  speed: 52,
  fuel: 76,
  doorOpen: false,
  reefer: { status: "running", power: 81 },
  ...overrides,
});

