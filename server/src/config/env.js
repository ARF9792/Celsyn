import "dotenv/config";

const parsePort = (value) => {
  const port = Number(value);
  return Number.isInteger(port) && port > 0 ? port : 5000;
};

export const env = Object.freeze({
  nodeEnv: process.env.NODE_ENV || "development",
  port: parsePort(process.env.PORT),
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  mongoUri: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/chainpulse",
  telemetryFlushIntervalMs: Number(process.env.TELEMETRY_FLUSH_INTERVAL_MS) || 400,
  telemetryMaxBatchSize: Number(process.env.TELEMETRY_MAX_BATCH_SIZE) || 500,
  jwtSecret: process.env.JWT_SECRET || "development-only-change-me",
  demoUserEmail: process.env.DEMO_USER_EMAIL || "demo@chainpulse.dev",
  demoUserPassword: process.env.DEMO_USER_PASSWORD || "chainpulse-demo",
});

