import { timingSafeEqual } from "node:crypto";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

const DEMO_USER = Object.freeze({
  id: "chainpulse-demo-operator",
  email: env.demoUserEmail,
  name: "Demo Operator",
  role: "operator",
});

const safeTextEqual = (left, right) => {
  const leftBuffer = Buffer.from(String(left));
  const rightBuffer = Buffer.from(String(right));
  if (leftBuffer.length !== rightBuffer.length) return false;
  return timingSafeEqual(leftBuffer, rightBuffer);
};

export const authenticateDemoUser = (email, password) => {
  if (!safeTextEqual(email.toLowerCase(), env.demoUserEmail.toLowerCase())) return null;
  if (!safeTextEqual(password, env.demoUserPassword)) return null;
  return DEMO_USER;
};

export const createAccessToken = (user = DEMO_USER) => jwt.sign(
  { sub: user.id, email: user.email, name: user.name, role: user.role },
  env.jwtSecret,
  { expiresIn: "8h", issuer: "chainpulse-api", audience: "chainpulse-dashboard" },
);

export const verifyAccessToken = (token) => jwt.verify(token, env.jwtSecret, {
  issuer: "chainpulse-api",
  audience: "chainpulse-dashboard",
});

export const publicUserFromToken = (payload) => ({
  id: payload.sub,
  email: payload.email,
  name: payload.name,
  role: payload.role,
});

