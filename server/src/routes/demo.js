import { Router } from "express";
import { env } from "../config/env.js";
import { trucksById } from "../data/trucks.js";
import { startTemperatureExcursion } from "../services/demo-scenarios.js";

export const demoRouter = Router();

demoRouter.use((_request, response, next) => {
  if (env.nodeEnv === "production") {
    return response.status(404).json({ error: "Not found" });
  }
  return next();
});

demoRouter.post("/trucks/:truckId/temperature-excursion", (request, response) => {
  if (!trucksById.has(request.params.truckId)) {
    return response.status(404).json({ error: "Truck not found" });
  }

  const scenario = startTemperatureExcursion(request.params.truckId);
  return response.status(202).json({
    activated: true,
    scenario: scenario.type,
    truckId: request.params.truckId,
    expiresAt: new Date(scenario.expiresAt).toISOString(),
    note: "Subsequent simulator events will show a rising temperature and reefer failure.",
  });
});

