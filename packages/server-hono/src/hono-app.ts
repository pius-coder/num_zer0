import { Hono } from "hono";
import { cors } from "hono/cors";
import type { AuraRuntime } from "@aura/core";
import { createBridgeRouter } from "./routes/bridge";
import { createManifestRouter } from "./routes/manifest";
import { createHealthRouter } from "./routes/health";
import { requestLogger } from "./middleware/logger";

export function createHonoApp(runtime: AuraRuntime): Hono {
  const app = new Hono();

  const appUrl = process.env["AURA_APP_URL"];
  if (!appUrl && process.env["NODE_ENV"] === "production") {
    throw new Error(
      "[aura] AURA_APP_URL must be set in production."
    );
  }
  app.use("*", cors({ origin: appUrl ?? "*", credentials: true }));
  app.use("*", requestLogger());

  app.route("/aura", createBridgeRouter(runtime));
  app.route("/manifest", createManifestRouter(runtime));
  app.route("/health", createHealthRouter());

  return app;
}
