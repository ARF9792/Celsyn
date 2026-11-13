import cors from "cors";
import express from "express";
import { env } from "./config/env.js";

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

  app.use((request, response) => {
    response.status(404).json({
      error: "Not found",
      path: request.originalUrl,
    });
  });

  return app;
};

