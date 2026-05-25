import { Hono } from "hono";

const startTime = Date.now();

export function createHealthRouter(): Hono {
  const router = new Hono();

  router.get("/", (c) => {
    return c.json({
      ok: true,
      uptime: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    });
  });

  return router;
}
