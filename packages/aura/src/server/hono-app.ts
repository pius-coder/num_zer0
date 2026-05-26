import { Hono } from "hono";
import { cors } from "hono/cors";
import { auraBridgeRouter } from "./routes/bridge";
import { auraInternalRouter } from "./routes/internal";
import { auraFilesRouter } from "./routes/files";
import { auraHealthRouter } from "./routes/health";
import { auraHttpActionsRouter } from "./routes/http-actions";
import { getClientOperationManifest } from "./registry";
import { runAuraOperation } from "./runner";
import { optionalApiKeyMiddleware } from "./middleware/auth";
import { requestLogger } from "./middleware/logger";

function dashboardEnabled(): boolean {
  const v = process.env.AURA_DASHBOARD_ENABLED;
  if (v === "0" || v === "false") return false;
  return process.env.NODE_ENV !== "production" || v === "1" || v === "true";
}

export async function createAuraHonoApp() {
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

  if (dashboardEnabled()) {
    // Conditional dynamic import: the dashboard plugin (and its UI assets)
    // stays out of the import graph entirely when AURA_DASHBOARD_ENABLED=0
    // (e.g. production by default).
    const { auraDashboardRouter } = await import("@aura/dashboard");
    app.route("/dashboard", auraDashboardRouter({
      getClientOperationManifest,
      runAuraOperation,
      optionalApiKeyMiddleware,
    }));
  }

  return app;
}

export type AuraHonoApp = Awaited<ReturnType<typeof createAuraHonoApp>>;
