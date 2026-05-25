import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Hono } from "hono";
import { eventBus, metricsStore } from "@aura/observability";
import { getClientOperationManifest } from "../registry";
import { runAuraOperation } from "../runner";
import { optionalApiKeyMiddleware } from "../middleware/auth";

let spaHtml: string | null = null;
const runHistory: Array<{ name: string; input: unknown; result: unknown; timestamp: Date; status: number }> = [];
const MAX_RUN_HISTORY = 200;
function getSpaHtml(): string | null {
  if (spaHtml !== null) return spaHtml;
  try {
    spaHtml = readFileSync(join(__dirname, "frontend", "index.html"), "utf-8");
  } catch {
    try {
      spaHtml = readFileSync(join(__dirname, "..", "..", "..", "src", "server", "dashboard", "frontend", "index.html"), "utf-8");
    } catch {
      spaHtml = "<html><body><h1>Dashboard SPA not found</h1></body></html>";
    }
  }
  return spaHtml;
}

export function auraDashboardRouter(): Hono {
  const router = new Hono();

  router.use("/api/*", optionalApiKeyMiddleware());

  function getOpMeta(name: string) {
    return getClientOperationManifest().operations.find((o) => o.name === name) ?? null;
  }

  router.get("/api/functions", (c) => {
    const ops = getClientOperationManifest().operations;
    const functions = ops.map((op) => ({
      name: op.name,
      type: op.type,
      metrics: metricsStore.getForFunction(op.name),
    }));
    return c.json({ functions });
  });

  router.get("/api/functions/:name", (c) => {
    const name = c.req.param("name");
    const meta = getOpMeta(name);
    if (!meta) return c.json({ error: "not found" }, 404);
    return c.json({
      name,
      type: meta.type,
      metrics: metricsStore.getForFunction(name),
      logs: eventBus.getRecent().filter((e) => e.name === name).slice(-50),
    });
  });

  router.post("/api/functions/:name/run", async (c) => {
    const name = c.req.param("name");
    let input: unknown;
    try {
      input = await c.req.json();
    } catch {
      return c.json({ error: "invalid JSON body" }, 400);
    }
    const result = await runAuraOperation({
      operationName: name,
      input,
      request: c.req.raw,
      source: "internal",
    });
    runHistory.push({ name, input, result: result.envelope, timestamp: new Date(), status: result.status });
    if (runHistory.length > MAX_RUN_HISTORY) runHistory.shift();
    return c.json(result.envelope, result.status as 200);
  });

  router.get("/api/functions/:name/history", (c) => {
    const name = c.req.param("name");
    return c.json({ runs: runHistory.filter((r) => r.name === name).slice(-50).reverse() });
  });

  router.get("/api/logs", (c) => {
    const limit = Math.min(Number(c.req.query("limit")) || 200, 1000);
    const name = c.req.query("name");
    const status = c.req.query("status") as "success" | "error" | undefined;
    const requestId = c.req.query("requestId");
    let logs = eventBus.getRecent();
    if (name) logs = logs.filter((e) => e.name === name);
    if (status) logs = logs.filter((e) => e.status === status);
    if (requestId) logs = logs.filter((e) => e.requestId === requestId);
    return c.json({ logs: logs.slice(-limit) });
  });

  router.get("/api/errors", (c) => {
    const errors = eventBus
      .getRecent()
      .filter((e) => e.status === "error")
      .slice(-100);
    return c.json({ errors });
  });

  router.get("/api/metrics", (c) => {
    const names = metricsStore.listFunctionNames();
    const all: Record<string, unknown> = {};
    for (const name of names) {
      all[name] = metricsStore.getForFunction(name);
    }
    return c.json({ metrics: all });
  });

  router.get("/", (c) => c.html(getSpaHtml() ?? ""));
  router.get("/*", (c) => {
    const path = c.req.path;
    if (!path.startsWith("/dashboard/api/") && !path.startsWith("/dashboard/ws")) {
      return c.html(getSpaHtml() ?? "");
    }
    return c.notFound();
  });

  return router;
}
