import cors from "cors";
import express from "express";
import { env } from "./config/env.js";
import { alertsRouter } from "./routes/alerts.js";
import { demoRouter } from "./routes/demo.js";
import { authenticateRequest } from "./middleware/authenticate.js";
import { authRouter } from "./routes/auth.js";
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

  app.use("/api/auth", authRouter);
  app.use("/api/telemetry", telemetryRouter);
  app.use("/api/trucks", authenticateRequest, trucksRouter);
  app.use("/api/fleet", authenticateRequest, fleetRouter);
  app.use("/api/alerts", authenticateRequest, alertsRouter);
  app.use("/api/demo", authenticateRequest, demoRouter);
  app.use("/api/system", authenticateRequest, systemRouter);

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

