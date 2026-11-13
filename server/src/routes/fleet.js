import { Router } from "express";
import { getFleetSummary } from "../services/fleet-state.js";

export const fleetRouter = Router();

fleetRouter.get("/summary", (_request, response) => {
  response.json({ summary: getFleetSummary() });
});

