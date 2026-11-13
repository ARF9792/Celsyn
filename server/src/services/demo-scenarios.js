const scenarios = new Map();
const DEMO_DURATION_MS = 30_000;

export const startTemperatureExcursion = (truckId) => {
  const scenario = {
    type: "temperature-excursion",
    startedAt: Date.now(),
    expiresAt: Date.now() + DEMO_DURATION_MS,
  };
  scenarios.set(truckId, scenario);
  return scenario;
};

export const applyDemoScenario = (telemetry, truck) => {
  const scenario = scenarios.get(telemetry.truckId);
  if (!scenario) return telemetry;

  if (Date.now() >= scenario.expiresAt) {
    scenarios.delete(telemetry.truckId);
    return telemetry;
  }

  const elapsedSeconds = (Date.now() - scenario.startedAt) / 1_000;
  const excursionTemperature = truck.safeTemperature.max + 0.5 + elapsedSeconds * 1.1;

  return {
    ...telemetry,
    temperature: Number(Math.min(truck.safeTemperature.max + 8, excursionTemperature).toFixed(2)),
    reefer: { status: "failed", power: Math.min(telemetry.reefer.power, 12) },
  };
};

export const resetDemoScenarios = () => scenarios.clear();

