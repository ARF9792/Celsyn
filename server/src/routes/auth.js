import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { z } from "zod";
import { authenticateRequest } from "../middleware/authenticate.js";
import { formatValidationIssues } from "../schemas/telemetry.js";
import { authenticateDemoUser, createAccessToken } from "../services/auth-service.js";

export const authRouter = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60_000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many login attempts; try again later" },
});

const loginSchema = z.strictObject({
  email: z.email(),
  password: z.string().min(8).max(128),
});

authRouter.post("/login", loginLimiter, (request, response) => {
  const parsed = loginSchema.safeParse(request.body);
  if (!parsed.success) {
    return response.status(400).json({
      error: "Invalid login request",
      issues: formatValidationIssues(parsed.error.issues),
    });
  }

  const user = authenticateDemoUser(parsed.data.email, parsed.data.password);
  if (!user) return response.status(401).json({ error: "Invalid email or password" });

  return response.json({ token: createAccessToken(user), user });
});

authRouter.get("/me", authenticateRequest, (request, response) => {
  response.json({ user: request.user });
});

