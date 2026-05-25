import type { MiddlewareHandler } from "hono";
import { AuraError, errorEnvelope } from "@aura/core";

export const internalSecretHeaderName = "x-aura-internal-secret";
export const apiKeyHeaderName = "x-api-key";

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

function getSecret(name: string): string | undefined {
  if (typeof process !== "undefined" && process.env) {
    return process.env[name];
  }
  return undefined;
}

export function verifyInternalSecret(header: string | undefined): boolean {
  const secret = getSecret("AURA_INTERNAL_SECRET");
  if (!secret || !header) return false;
  return constantTimeEqual(header, secret);
}

export function verifyApiKey(header: string | undefined): boolean {
  const key = getSecret("AURA_API_KEY");
  if (!key || !header) return false;
  const token = header.startsWith("Bearer ") ? header.slice(7) : header;
  return constantTimeEqual(token, key);
}

export function internalSecretMiddleware(): MiddlewareHandler {
  return async (c, next) => {
    if (!verifyInternalSecret(c.req.header(internalSecretHeaderName))) {
      const error = new AuraError("FORBIDDEN", "Invalid internal secret.");
      return c.json(errorEnvelope({ error, requestId: "?" }) as unknown as Record<string, unknown>, 403 as const);
    }
    await next();
  };
}

export function apiKeyMiddleware(): MiddlewareHandler {
  return async (c, next) => {
    if (!verifyApiKey(c.req.header("Authorization"))) {
      const error = new AuraError("FORBIDDEN", "Invalid API key.");
      return c.json(errorEnvelope({ error, requestId: "?" }) as unknown as Record<string, unknown>, 403 as const);
    }
    await next();
  };
}

export function optionalApiKeyMiddleware(): MiddlewareHandler {
  return async (c, next) => {
    const auth = c.req.header("Authorization");
    if (auth && !verifyApiKey(auth)) {
      const error = new AuraError("FORBIDDEN", "Invalid API key.");
      return c.json(errorEnvelope({ error, requestId: "?" }) as unknown as Record<string, unknown>, 403 as const);
    }
    await next();
  };
}
