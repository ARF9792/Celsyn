import { Router } from "express";
import { getFleetSnapshots, getTruckSnapshot } from "../services/fleet-state.js";

export const trucksRouter = Router();

trucksRouter.get("/", (_request, response) => {
  response.json({ trucks: getFleetSnapshots() });
});

trucksRouter.get("/:truckId", (request, response) => {
  const truck = getTruckSnapshot(request.params.truckId);
  if (!truck) {
    return response.status(404).json({ error: "Truck not found" });
  }

  return response.json({ truck });
});

