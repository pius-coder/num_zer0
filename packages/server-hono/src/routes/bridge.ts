import { Hono } from "hono";
import type { AuraRuntime } from "@aura/core";
import { AuraError, coreRunOperation, errorEnvelope } from "@aura/core";
import type { AuraCookieMutation } from "@aura/core";

function serializeCookie(cookie: AuraCookieMutation): string {
  const parts = [`${cookie.name}=${encodeURIComponent(cookie.value)}`];
  const options = cookie.options;

  if (options.maxAge !== undefined) parts.push(`Max-Age=${options.maxAge}`);
  if (options.expires) parts.push(`Expires=${options.expires.toUTCString()}`);
  if (options.path) parts.push(`Path=${options.path}`);
  if (options.httpOnly) parts.push("HttpOnly");
  if (options.secure) parts.push("Secure");
  if (options.sameSite) parts.push(`SameSite=${options.sameSite}`);

  return parts.join("; ");
}

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

    for (const cookie of ctx.cookies.set) {
      c.header("Set-Cookie", serializeCookie(cookie), { append: true });
    }

    return c.json(result.envelope as unknown as Record<string, unknown>, result.status as 200 | 500);
  });

  return router;
}
