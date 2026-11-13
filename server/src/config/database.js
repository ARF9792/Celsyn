import mongoose from "mongoose";
import { env } from "./env.js";

export const connectDatabase = async () => {
  await mongoose.connect(env.mongoUri, {
    serverSelectionTimeoutMS: 3_000,
  });

  console.log(JSON.stringify({
    level: "info",
    message: "MongoDB connected",
    database: mongoose.connection.name,
  }));
};

export const disconnectDatabase = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
};

export const isDatabaseConnected = () => mongoose.connection.readyState === 1;

