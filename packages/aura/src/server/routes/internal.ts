

import { Hono } from "hono";
import { v4 as uuidv4 } from "uuid";
import { internalSecretMiddleware } from "../middleware/auth";
import { runAuraCron } from "../cron";

/**
 * `auraInternalRouter()` — Hono router for the Aura internal endpoint.
 *
 * Resolves Requirements 1.8, 1.9, 1.10.
 *
 * Accepts `POST /aura-internal/:path{.*}` (the path segment is ignored —
 * the legacy Next.js route used a catch-all `[[...aura]]` but the only
 * meaningful field is the JSON body's `jobName`).
 *
 * Security: the `x-aura-internal-secret` header is compared against
 * `AURA_INTERNAL_SECRET` using `timingSafeEqual` (constant-time, prevents
 * timing attacks — Decision 1 in design.md).
 *
 * Response shape on error: `AuraErrorEnvelope`
 *   `{ ok: false, error: { code, message, status, requestId } }`
 */
export function auraInternalRouter(): Hono {
  const router = new Hono();

  router.use("/*", internalSecretMiddleware());

  router.post("/:path{.*}", async (c) => {
    const requestId = uuidv4();

    // ── 2. Parse the request body ─────────────────────────────────────────
    let payload: unknown;
    try {
      payload = await c.req.json();
    } catch {
      return c.json(
        {
          ok: false,
          error: {
            code: "BAD_REQUEST",
            message: "Corps de requête JSON invalide.",
            status: 400,
            requestId,
          },
        },
        400,
      );
    }

    if (
      !payload ||
      typeof payload !== "object" ||
      !("jobName" in payload) ||
      typeof (payload as Record<string, unknown>).jobName !== "string"
    ) {
      return c.json(
        {
          ok: false,
          error: {
            code: "BAD_REQUEST",
            message: "jobName requis.",
            status: 400,
            requestId,
          },
        },
        400,
      );
    }

    const { jobName } = payload as { jobName: string };

    // ── 3. Run the cron job ───────────────────────────────────────────────
    const result = await runAuraCron(jobName);

    return c.json(
      {
        ok: result.status === "succeeded",
        result,
      },
      result.status === "succeeded" ? 200 : 500,
    );
  });

  return router;
}
