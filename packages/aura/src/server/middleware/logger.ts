import type { MiddlewareHandler } from "hono";

export function requestLogger(): MiddlewareHandler {
  return async function logger(c, next) {
    const start = performance.now();
    const method = c.req.method;
    const path = c.req.path;

    await next();

    const duration = (performance.now() - start).toFixed(1);
    const status = c.res.status;
    console.log(`[aura] ${method} ${path} ${status} ${duration}ms`);
  };
}
