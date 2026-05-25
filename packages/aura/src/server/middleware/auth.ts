import { timingSafeEqual } from "node:crypto";
import type { MiddlewareHandler } from "hono";
import { v4 as uuidv4 } from "uuid";

import { errorEnvelope } from "../../core/envelope";
import { AuraError } from "../../core/errors";

export const internalSecretHeaderName = "x-aura-internal-secret";
export const apiKeyHeaderName = "x-aura-api-key";

function safeEqual(expected: string | undefined, provided: string | undefined): boolean {
  if (!expected || !provided) return false;
  const expectedBuffer = Buffer.from(expected, "utf8");
  const providedBuffer = Buffer.from(provided, "utf8");
  if (expectedBuffer.length !== providedBuffer.length) return false;
  return timingSafeEqual(expectedBuffer, providedBuffer);
}

function bearerToken(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const [scheme, token] = value.split(" ", 2);
  if (scheme?.toLowerCase() !== "bearer") return undefined;
  return token;
}

function forbidden(message: string) {
  const error = new AuraError("FORBIDDEN", message, { status: 403 });
  return errorEnvelope({ error, requestId: uuidv4() });
}

export function verifyInternalSecret(headerValue: string | undefined): boolean {
  return safeEqual(process.env.AURA_INTERNAL_SECRET, headerValue);
}

export function verifyApiKey(headerValue: string | undefined): boolean {
  return safeEqual(process.env.AURA_API_KEY, headerValue);
}

export function internalSecretMiddleware(): MiddlewareHandler {
  return async (c, next) => {
    if (!verifyInternalSecret(c.req.header(internalSecretHeaderName))) {
      return c.json(forbidden("Secret interne invalide."), 403);
    }
    return next();
  };
}

export function apiKeyMiddleware(): MiddlewareHandler {
  return async (c, next) => {
    const key = c.req.header(apiKeyHeaderName) ?? bearerToken(c.req.header("authorization"));
    if (!verifyApiKey(key)) {
      return c.json(forbidden("Clé API invalide."), 403);
    }
    return next();
  };
}

export function optionalApiKeyMiddleware(): MiddlewareHandler {
  return async (c, next) => {
    if (!process.env.AURA_API_KEY) return next();
    const key = c.req.header(apiKeyHeaderName) ?? bearerToken(c.req.header("authorization"));
    if (!verifyApiKey(key)) {
      return c.json(forbidden("Clé API invalide."), 403);
    }
    return next();
  };
}
