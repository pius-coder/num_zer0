import { Hono } from "hono";
import { cors } from "hono/cors";
import { auraBridgeRouter } from "./routes/bridge";
import { auraInternalRouter } from "./routes/internal";
import { auraFilesRouter } from "./routes/files";
import { auraHealthRouter } from "./routes/health";
import { auraHttpActionsRouter } from "./routes/http-actions";
import { auraDashboardRouter } from "@aura/dashboard";
import { getClientOperationManifest } from "./registry";
import { runAuraOperation } from "./runner";
import { optionalApiKeyMiddleware } from "./middleware/auth";
import { requestLogger } from "./middleware/logger";

export function createAuraHonoApp() {
  const app = new Hono();

  app.use("*", cors({
    origin: process.env.AURA_APP_URL ?? "http://localhost:3000",
    credentials: true,
  }));
  app.use("*", requestLogger());

  app.route("/aura", auraBridgeRouter());
  app.route("/aura-internal", auraInternalRouter());
  app.route("/files", auraFilesRouter());
  app.route("/health", auraHealthRouter());
  app.route("/aura-http", auraHttpActionsRouter());
  app.route("/dashboard", auraDashboardRouter({
    getClientOperationManifest,
    runAuraOperation,
    optionalApiKeyMiddleware,
  }));

  return app;
}

export type AuraHonoApp = ReturnType<typeof createAuraHonoApp>;
