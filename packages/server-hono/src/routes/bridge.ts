import { Hono } from "hono";
import type { AuraRuntime } from "@aura/core";
import { AuraError, coreRunOperation, errorEnvelope } from "@aura/core";

export function createBridgeRouter(runtime: AuraRuntime): Hono {
  const router = new Hono();

  router.post("/:path{.+}", async (c) => {
    const operationName = c.req.param("path").replace(/\//g, ".");

    const operation = runtime.operations.get(operationName);
    if (!operation) {
      const error = new AuraError("NOT_FOUND", `Operation not found: ${operationName}`);
      return c.json(errorEnvelope({ error, requestId: "?" }) as unknown as Record<string, unknown>, 404 as const);
    }

    const requestId = crypto.randomUUID();
    const body = await c.req.json().catch(() => ({}));

    const ctx = await runtime.createContext({
      request: c.req.raw,
      source: "bridge",
      requestId,
    });

    const result = await coreRunOperation({
      operation,
      ctx,
      input: body,
    });

    return c.json(result.envelope as unknown as Record<string, unknown>, result.status as 200 | 500);
  });

  return router;
}
