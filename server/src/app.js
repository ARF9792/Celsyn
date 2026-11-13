import cors from "cors";
import express from "express";
import { env } from "./config/env.js";
import { alertsRouter } from "./routes/alerts.js";
import { demoRouter } from "./routes/demo.js";
import { fleetRouter } from "./routes/fleet.js";
import { telemetryRouter } from "./routes/telemetry.js";
import { trucksRouter } from "./routes/trucks.js";
import { systemRouter } from "./routes/system.js";

export const createApp = () => {
  const app = express();

  app.disable("x-powered-by");
  app.use(cors({ origin: env.clientUrl, credentials: true }));
  app.use(express.json({ limit: "1mb" }));

  app.get("/api/health", (_request, response) => {
    response.json({
      status: "ok",
      service: "chainpulse-api",
      timestamp: new Date().toISOString(),
    });
  });

  app.use("/api/telemetry", telemetryRouter);
  app.use("/api/trucks", trucksRouter);
  app.use("/api/fleet", fleetRouter);
  app.use("/api/alerts", alertsRouter);
  app.use("/api/demo", demoRouter);
  app.use("/api/system", systemRouter);

  app.use((request, response) => {
    response.status(404).json({
      error: "Not found",
      path: request.originalUrl,
    });
  });

  app.use((error, _request, response, _next) => {
    console.error(JSON.stringify({
      level: "error",
      message: "Unhandled request error",
      error: error.message,
    }));
    response.status(500).json({ error: "Internal server error" });
  });

  return app;
};

