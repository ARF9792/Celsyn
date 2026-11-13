import { trucks } from "../src/data/trucks.js";
import { createTruckSimulator } from "../src/simulator/generator.js";

const readArguments = (argumentsList) => Object.fromEntries(
  argumentsList
    .filter((argument) => argument.startsWith("--"))
    .map((argument) => {
      const [key, value = "true"] = argument.slice(2).split("=");
      return [key, value];
    }),
);

const parseNumber = (value, fallback, { min, max }) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= min && parsed <= max ? parsed : fallback;
};

const args = readArguments(process.argv.slice(2));
const truckCount = parseNumber(args.trucks, 25, { min: 1, max: trucks.length });
const intervalMs = parseNumber(args.interval, 200, { min: 50, max: 60_000 });
const anomalyRate = parseNumber(args["anomaly-rate"], 0.002, { min: 0, max: 1 });
const durationMs = parseNumber(args.duration, 0, { min: 0, max: 86_400_000 });
const backendUrl = (args["backend-url"] || process.env.SIMULATOR_BACKEND_URL || "http://localhost:5000")
  .replace(/\/$/, "");

const selectedTrucks = trucks.slice(0, truckCount);

const loadInitialSequences = async () => {
  try {
    const response = await fetch(`${backendUrl}/api/telemetry/sequences`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = await response.json();
    return new Map(payload.sequences.map((truck) => [
      truck.truckId,
      truck.sequence || 0,
    ]));
  } catch (error) {
    console.warn(JSON.stringify({
      level: "warn",
      message: "Could not load existing truck sequences; starting from zero",
      error: error.message,
    }));
    return new Map();
  }
};

const initialSequences = await loadInitialSequences();
const simulators = selectedTrucks.map((truck) => createTruckSimulator(truck, {
  anomalyRate,
  initialSequence: initialSequences.get(truck.truckId) || 0,
}));

let generatedEvents = 0;
let acceptedEvents = 0;
let ingestionFailures = 0;
let inFlight = false;
const startedAt = Date.now();

console.log(JSON.stringify({
  level: "info",
  message: "ChainPulse simulator started",
  trucks: truckCount,
  intervalMs,
  backendUrl,
  anomalyRate,
  durationMs: durationMs || null,
}));

const sendBatch = async () => {
  if (inFlight) {
    ingestionFailures += truckCount;
    return;
  }

  inFlight = true;
  const batch = simulators.map((simulator) => simulator.next());
  generatedEvents += batch.length;

  try {
    const response = await fetch(`${backendUrl}/api/telemetry/batch`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(batch),
    });
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(`${response.status} ${JSON.stringify(payload)}`);
    }

    acceptedEvents += payload.accepted || 0;
    ingestionFailures += payload.rejected || 0;
  } catch (error) {
    ingestionFailures += batch.length;
    console.error(JSON.stringify({
      level: "error",
      message: "Telemetry batch ingestion failed",
      error: error.message,
    }));
  } finally {
    inFlight = false;
  }
};

const interval = setInterval(sendBatch, intervalMs);
await sendBatch();

const report = () => {
  const elapsedSeconds = Math.max((Date.now() - startedAt) / 1000, 0.001);
  console.log(JSON.stringify({
    level: "info",
    message: "Simulator metrics",
    generatedEvents,
    acceptedEvents,
    eventsPerSecond: Number((generatedEvents / elapsedSeconds).toFixed(1)),
    ingestionFailures,
  }));
};

const reporter = setInterval(report, 5_000);

const stop = async (signal) => {
  clearInterval(interval);
  clearInterval(reporter);
  while (inFlight) {
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
  report();
  console.log(JSON.stringify({ level: "info", message: "Simulator stopped", signal }));
  process.exit(ingestionFailures > 0 ? 1 : 0);
};

if (durationMs > 0) {
  setTimeout(() => stop("duration-complete"), durationMs);
}

process.on("SIGINT", () => stop("SIGINT"));
process.on("SIGTERM", () => stop("SIGTERM"));

