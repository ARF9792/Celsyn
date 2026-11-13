import { Router } from "express";
import { z } from "zod";
import { trucksById } from "../data/trucks.js";
import { formatValidationIssues } from "../schemas/telemetry.js";
import { getFleetSnapshots, getTruckSnapshot } from "../services/fleet-state.js";
import { getTruckHistory } from "../services/history-service.js";
import { getTruckComplianceAnalytics } from "../services/compliance-analytics.js";

export const trucksRouter = Router();

const historyQuerySchema = z.object({
  minutes: z.coerce.number().int().min(1).max(1_440).default(60),
  from: z.iso.datetime({ offset: true }).optional(),
  to: z.iso.datetime({ offset: true }).optional(),
  limit: z.coerce.number().int().min(1).max(1_000).default(500),
});

const complianceQuerySchema = z.object({
  minutes: z.coerce.number().int().min(1).max(10_080).default(60),
  from: z.iso.datetime({ offset: true }).optional(),
  to: z.iso.datetime({ offset: true }).optional(),
});

trucksRouter.get("/", (_request, response) => {
  response.json({ trucks: getFleetSnapshots() });
});

trucksRouter.get("/:truckId/compliance", async (request, response, next) => {
  const truck = trucksById.get(request.params.truckId);
  if (!truck) return response.status(404).json({ error: "Truck not found" });

  const parsed = complianceQuerySchema.safeParse(request.query);
  if (!parsed.success) {
    return response.status(400).json({
      error: "Invalid compliance query",
      issues: formatValidationIssues(parsed.error.issues),
    });
  }

  const to = parsed.data.to ? new Date(parsed.data.to) : new Date();
  const from = parsed.data.from
    ? new Date(parsed.data.from)
    : new Date(to.getTime() - parsed.data.minutes * 60_000);

  if (from > to) {
    return response.status(400).json({ error: "Compliance 'from' must not be after 'to'" });
  }

  try {
    const analytics = await getTruckComplianceAnalytics(truck, { from, to });
    return response.json({
      truckId: truck.truckId,
      cargoType: truck.cargoType,
      from: from.toISOString(),
      to: to.toISOString(),
      analytics,
    });
  } catch (error) {
    return next(error);
  }
});

trucksRouter.get("/:truckId/history", async (request, response, next) => {
  if (!trucksById.has(request.params.truckId)) {
    return response.status(404).json({ error: "Truck not found" });
  }

  const parsed = historyQuerySchema.safeParse(request.query);
  if (!parsed.success) {
    return response.status(400).json({
      error: "Invalid history query",
      issues: formatValidationIssues(parsed.error.issues),
    });
  }

  const to = parsed.data.to ? new Date(parsed.data.to) : new Date();
  const from = parsed.data.from
    ? new Date(parsed.data.from)
    : new Date(to.getTime() - parsed.data.minutes * 60_000);

  if (from > to) {
    return response.status(400).json({ error: "History 'from' must not be after 'to'" });
  }

  try {
    const events = await getTruckHistory(request.params.truckId, {
      from,
      to,
      limit: parsed.data.limit,
    });
    return response.json({
      truckId: request.params.truckId,
      from: from.toISOString(),
      to: to.toISOString(),
      count: events.length,
      events,
    });
  } catch (error) {
    return next(error);
  }
});

trucksRouter.get("/:truckId", (request, response) => {
  const truck = getTruckSnapshot(request.params.truckId);
  if (!truck) {
    return response.status(404).json({ error: "Truck not found" });
  }

  return response.json({ truck });
});

