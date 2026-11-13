import { rateLimit } from "express-rate-limit";

export const ingestionRateLimit = rateLimit({
  windowMs: 60_000,
  limit: 6_000,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    error: "Telemetry ingestion rate limit exceeded",
    retryAfter: "Try again after the current one-minute window",
  },
});

