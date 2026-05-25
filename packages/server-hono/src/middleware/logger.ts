import type { MiddlewareHandler } from "hono";

export function requestLogger(): MiddlewareHandler {
  return async (c, next) => {
    const start = performance.now();
    await next();
    const duration = performance.now() - start;
    console.log(`[aura] ${c.req.method} ${c.req.path} ${c.res.status} ${duration.toFixed(0)}ms`);
  };
}
