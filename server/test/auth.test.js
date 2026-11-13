import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { createAccessToken } from "../src/services/auth-service.js";

describe("dashboard authentication", () => {
  it("issues a JWT for the seeded demo account", async () => {
    const response = await request(createApp()).post("/api/auth/login").send({
      email: "demo@chainpulse.dev",
      password: "chainpulse-demo",
    });

    expect(response.status).toBe(200);
    expect(response.body.user).toMatchObject({ role: "operator" });
    expect(response.body.token).toEqual(expect.any(String));
  });

  it("rejects invalid credentials and protects dashboard APIs", async () => {
    const app = createApp();
    const invalidLogin = await request(app).post("/api/auth/login").send({
      email: "demo@chainpulse.dev",
      password: "wrong-password",
    });
    const anonymousFleet = await request(app).get("/api/fleet/summary");
    const authenticatedFleet = await request(app)
      .get("/api/fleet/summary")
      .set("authorization", `Bearer ${createAccessToken()}`);

    expect(invalidLogin.status).toBe(401);
    expect(anonymousFleet.status).toBe(401);
    expect(authenticatedFleet.status).toBe(200);
  });
});

