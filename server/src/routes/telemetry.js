import { Router } from "express";
import { ingestionRateLimit } from "../middleware/ingestion-rate-limit.js";
import {
  formatValidationIssues,
  telemetryBatchSchema,
  telemetrySchema,
} from "../schemas/telemetry.js";
import { ingestTelemetry } from "../services/telemetry-service.js";
import { pipelineMetrics } from "../services/pipeline-metrics.js";

export const telemetryRouter = Router();

const rejection = (result) => ({
  accepted: false,
  error: result.reason === "UNKNOWN_TRUCK"
    ? "Truck is not registered"
    : "Event sequence is stale or duplicated",
  code: result.reason,
});

telemetryRouter.post("/", ingestionRateLimit, (request, response) => {
  pipelineMetrics.recordReceived();
  const parsed = telemetrySchema.safeParse(request.body);
  if (!parsed.success) {
    pipelineMetrics.recordRejected();
    return response.status(400).json({
      error: "Invalid telemetry event",
      issues: formatValidationIssues(parsed.error.issues),
    });
  }

  const result = ingestTelemetry(parsed.data);
  if (!result.accepted) {
    pipelineMetrics.recordRejected();
    return response.status(result.reason === "UNKNOWN_TRUCK" ? 404 : 409).json(rejection(result));
  }

  pipelineMetrics.recordAccepted();

  return response.status(202).json({
    accepted: true,
    eventId: parsed.data.eventId,
    truckId: parsed.data.truckId,
    sequence: parsed.data.sequence,
  });
});

telemetryRouter.post("/batch", ingestionRateLimit, (request, response) => {
  const batch = telemetryBatchSchema.safeParse(request.body);
  if (!batch.success) {
    pipelineMetrics.recordReceived();
    pipelineMetrics.recordRejected();
    return response.status(400).json({
      error: "Invalid telemetry batch",
      issues: formatValidationIssues(batch.error.issues),
    });
  }

  pipelineMetrics.recordReceived(batch.data.length);

  const errors = [];
  let accepted = 0;

  batch.data.forEach((candidate, index) => {
    const parsed = telemetrySchema.safeParse(candidate);
    if (!parsed.success) {
      errors.push({ index, code: "VALIDATION_ERROR", issues: formatValidationIssues(parsed.error.issues) });
      return;
    }

    const result = ingestTelemetry(parsed.data);
    if (!result.accepted) {
      errors.push({ index, code: result.reason, truckId: parsed.data.truckId });
      return;
    }

    accepted += 1;
  });

  pipelineMetrics.recordAccepted(accepted);
  pipelineMetrics.recordRejected(errors.length);

  return response.status(202).json({
    accepted,
    rejected: errors.length,
    errors,
  });
});

