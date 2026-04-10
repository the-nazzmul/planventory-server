import { describe, expect, it } from "vitest";
import request from "supertest";

const requiredEnv = [
  "NODE_ENV",
  "PORT",
  "DATABASE_URL",
  "DIRECT_URL",
  "JWT_PRIVATE_KEY",
  "JWT_PUBLIC_KEY",
  "REDIS_URL",
  "REDIS_TOKEN",
  "R2_ACCOUNT_ID",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET_NAME",
  "R2_PUBLIC_URL",
  "ALLOWED_ORIGINS",
];

const hasEnv = requiredEnv.every((key) => Boolean(process.env[key]));
const describeIfEnv = hasEnv ? describe : describe.skip;

describeIfEnv("API smoke checks", () => {
  it("GET /api/v1/health responds successfully", async () => {
    const { createApp } = await import("../../src/app.js");
    const app = createApp();
    const response = await request(app).get("/api/v1/health");
    expect(response.status).toBeLessThan(500);
  });

  it("GET /api/v1/products without auth is rejected", async () => {
    const { createApp } = await import("../../src/app.js");
    const app = createApp();
    const response = await request(app).get("/api/v1/products");
    expect([401, 403]).toContain(response.status);
  });
});
