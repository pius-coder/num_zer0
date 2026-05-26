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
import { rateLimitMiddleware } from "./middleware/rate-limit";
import type { DashboardDependencies } from "@aura/dashboard";

function dashboardEnabled(): boolean {
  const v = process.env.AURA_DASHBOARD_ENABLED;
  if (v === "0" || v === "false") return false;
  return process.env.NODE_ENV !== "production" || v === "1" || v === "true";
}

export async function createAuraHonoApp() {
  const app = new Hono();

  const appUrl = process.env.AURA_APP_URL;
  if (!appUrl && process.env.NODE_ENV === "production") {
    throw new Error(
      "[aura] AURA_APP_URL must be set in production (frontend origin for CORS allow-list)."
    );
  }

  app.use("*", cors({
    origin: appUrl ?? "http://localhost:3000",
    credentials: true,
  }));
  app.use("*", requestLogger());

  const bridgeLimiter = rateLimitMiddleware({
    key: (c) => `bridge:${c.req.header("x-forwarded-for") ?? "anon"}`,
    limit: 120,
    windowMs: 60_000,
  });

  app.use("/aura/*", bridgeLimiter);
  app.route("/aura", auraBridgeRouter());
  app.route("/aura-internal", auraInternalRouter());
  app.route("/files", auraFilesRouter());
  app.route("/health", auraHealthRouter());
  app.route("/aura-http", auraHttpActionsRouter());

  if (dashboardEnabled()) {
    if (!process.env.AURA_API_KEY) {
      console.warn("[aura] AURA_API_KEY not set — dashboard is unprotected!");
    }

    const dashboardLimiter = rateLimitMiddleware({
      key: (c) => `dashboard:${c.req.header("x-forwarded-for") ?? "anon"}`,
      limit: 60,
      windowMs: 60_000,
    });

    app.use("/dashboard/*", dashboardLimiter);

    const { auraDashboardRouter } = await import("@aura/dashboard");
    app.route("/dashboard", auraDashboardRouter({
      getClientOperationManifest,
      runAuraOperation: runAuraOperation as unknown as DashboardDependencies["runAuraOperation"],
      optionalApiKeyMiddleware,
    }));
  }

  return app;
}

export type AuraHonoApp = Awaited<ReturnType<typeof createAuraHonoApp>>;
