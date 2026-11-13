import { createServer } from "node:http";
import { createApp } from "./app.js";
import { env } from "./config/env.js";

const app = createApp();
const server = createServer(app);

server.listen(env.port, () => {
  console.log(JSON.stringify({
    level: "info",
    message: "ChainPulse API listening",
    port: env.port,
    environment: env.nodeEnv,
  }));
});

const shutdown = (signal) => {
  console.log(JSON.stringify({ level: "info", message: "Shutting down", signal }));
  server.close((error) => {
    if (error) {
      console.error(error);
      process.exit(1);
    }
    process.exit(0);
  });
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

