import { Router } from "express";
import { pipelineMetrics } from "../services/pipeline-metrics.js";

export const systemRouter = Router();

systemRouter.get("/metrics", (_request, response) => {
  response.json({ metrics: pipelineMetrics.getSnapshot() });
});

