import { Router } from "express";
import { z } from "zod";
import { trucksById } from "../data/trucks.js";
import { formatValidationIssues } from "../schemas/telemetry.js";
import { listRecentAlerts } from "../services/anomaly-service.js";

export const alertsRouter = Router();

const alertsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
  truckId: z.string().optional(),
  severity: z.enum(["warning", "critical"]).optional(),
});

alertsRouter.get("/", (request, response) => {
  const parsed = alertsQuerySchema.safeParse(request.query);
  if (!parsed.success) {
    return response.status(400).json({
      error: "Invalid alerts query",
      issues: formatValidationIssues(parsed.error.issues),
    });
  }

  if (parsed.data.truckId && !trucksById.has(parsed.data.truckId)) {
    return response.status(404).json({ error: "Truck not found" });
  }

  const alerts = listRecentAlerts(parsed.data);
  return response.json({ count: alerts.length, alerts });
});

