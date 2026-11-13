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
});

