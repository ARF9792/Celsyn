import { createServer } from "node:http";
import { createApp } from "./app.js";
import { connectDatabase, disconnectDatabase } from "./config/database.js";
import { env } from "./config/env.js";
import { telemetryPersistence } from "./services/telemetry-persistence.js";

const app = createApp();
const server = createServer(app);

try {
  await connectDatabase();
  telemetryPersistence.start();
} catch (error) {
  console.error(JSON.stringify({
    level: "warn",
    message: "MongoDB unavailable; live telemetry will run without persistence",
    error: error.message,
  }));
}

server.listen(env.port, () => {
  console.log(JSON.stringify({
    level: "info",
    message: "ChainPulse API listening",
    port: env.port,
    environment: env.nodeEnv,
  }));
});

let shuttingDown = false;

const shutdown = (signal) => {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(JSON.stringify({ level: "info", message: "Shutting down", signal }));
  server.close(async (error) => {
    if (error) {
      console.error(error);
      process.exit(1);
    }
    try {
      await telemetryPersistence.stop();
      await disconnectDatabase();
      process.exit(0);
    } catch (shutdownError) {
      console.error(shutdownError);
      process.exit(1);
    }
  });
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

