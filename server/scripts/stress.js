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

const boundedNumber = (value, fallback, minimum, maximum) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= minimum && parsed <= maximum ? parsed : fallback;
};

const args = readArguments(process.argv.slice(2));
const truckCount = boundedNumber(args.trucks, 25, 1, trucks.length);
const targetRate = boundedNumber(args.rate, 2_500, 1, 20_000);
const durationSeconds = boundedNumber(args.duration, 10, 1, 300);
const batchSize = boundedNumber(args["batch-size"], 500, 1, 500);
const backendUrl = (args["backend-url"] || process.env.STRESS_BACKEND_URL || "http://localhost:5000")
  .replace(/\/$/, "");

const loadInitialSequences = async () => {
  const response = await fetch(`${backendUrl}/api/telemetry/sequences`);
  if (!response.ok) throw new Error(`Unable to load sequences: HTTP ${response.status}`);
  const payload = await response.json();
  return new Map(payload.sequences.map((entry) => [entry.truckId, entry.sequence]));
};

const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

const selectedTrucks = trucks.slice(0, truckCount);
const initialSequences = await loadInitialSequences();
const simulators = selectedTrucks.map((truck) => createTruckSimulator(truck, {
  anomalyRate: 0,
  initialSequence: initialSequences.get(truck.truckId) || 0,
}));

const targetEvents = Math.floor(targetRate * durationSeconds);
let generatedEvents = 0;
let acceptedEvents = 0;
let rejectedEvents = 0;
let failedRequests = 0;
let simulatorIndex = 0;
const startedAt = performance.now();

console.log(JSON.stringify({
  level: "info",
  message: "ChainPulse stress test started",
  trucks: truckCount,
  targetRate,
  durationSeconds,
  targetEvents,
  batchSize,
  backendUrl,
}));

while (generatedEvents < targetEvents) {
  const currentBatchSize = Math.min(batchSize, targetEvents - generatedEvents);
  const timestamp = new Date();
  const batch = Array.from({ length: currentBatchSize }, () => {
    const simulator = simulators[simulatorIndex % simulators.length];
    simulatorIndex += 1;
    return simulator.next(timestamp);
  });

  const response = await fetch(`${backendUrl}/api/telemetry/batch`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(batch),
  });
  generatedEvents += batch.length;

  if (!response.ok) {
    failedRequests += 1;
    rejectedEvents += batch.length;
  } else {
    const payload = await response.json();
    acceptedEvents += payload.accepted || 0;
    rejectedEvents += payload.rejected || 0;
  }

  const targetElapsedMs = (generatedEvents / targetRate) * 1_000;
  const actualElapsedMs = performance.now() - startedAt;
  if (targetElapsedMs > actualElapsedMs) {
    await delay(targetElapsedMs - actualElapsedMs);
  }
}

const elapsedSeconds = (performance.now() - startedAt) / 1_000;
const result = {
  generatedEvents,
  acceptedEvents,
  rejectedEvents,
  failedRequests,
  durationSeconds: Number(elapsedSeconds.toFixed(3)),
  achievedEventsPerSecond: Number((generatedEvents / elapsedSeconds).toFixed(1)),
  acceptanceRatePercent: Number(((acceptedEvents / generatedEvents) * 100).toFixed(2)),
};

console.log(JSON.stringify({
  level: failedRequests > 0 || rejectedEvents > 0 ? "error" : "info",
  message: "ChainPulse stress test completed",
  ...result,
}));

process.exitCode = failedRequests > 0 || rejectedEvents > 0 ? 1 : 0;

