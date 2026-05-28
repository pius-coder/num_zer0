import { cache } from "react";
import { db } from "./db";
import type { AuraContext, AuraSource } from "./context";
import type { OperationRef, AuraAgent, AuraScheduler } from "@/aura/core/types";
import { createAuraLogger } from "@aura/observability";
import { createBumpStore } from "./bump";
import { createNotificationDispatcher } from "@aura/notifications";
import { resolveSessionFromRequest } from "./auth/session";
import {
  sessionCookieName,
  isSecureCookieEnvironment,
  parseCookieHeader,
  getSameSite,
} from "./transport/cookies";
import { toPrismaJson } from "./json";
import { createAuraStorage } from "./storage";
import { createTrackedDb, type TrackSink } from "./db-tracked";
import { v4 as uuidv4 } from "uuid";

/**
 * Lazy agent wrapper — avoids pulling `@langchain/core` (and its 13Mo of
 * transitive deps) into the import graph until an operation actually calls
 * `ctx.agent.*`. Each call resolves once and caches the real surface.
 */
function createLazyAgent(): AuraAgent {
  let resolved: Promise<AuraAgent> | null = null;
  const resolve = (): Promise<AuraAgent> => {
    if (!resolved) {
      resolved = import("./ai/context-binding").then((m) => m.createAuraAgent());
    }
    return resolved;
  };
  return {
    async createThread(ref, opts) {
      return (await resolve()).createThread(ref, opts);
    },
    async generateText(thread, opts) {
      return (await resolve()).generateText(thread, opts);
    },
    async streamText(thread, opts) {
      return (await resolve()).streamText(thread, opts);
    },
    async getUsage(opts) {
      return (await resolve()).getUsage(opts);
    },
  };
}

/**
 * Lazy scheduler wrapper — same idea: avoid loading `@aura/workflows` (and
 * its scheduler runtime) until an operation actually schedules a job.
 */
function createLazyScheduler(): AuraScheduler {
  let resolved: Promise<AuraScheduler> | null = null;
  const resolve = (): Promise<AuraScheduler> => {
    if (!resolved) {
      resolved = import("@aura/workflows").then((m) => m.createAuraScheduler(db));
    }
    return resolved;
  };
  return {
    async runAfter(delayMs, ref, input) {
      return (await resolve()).runAfter(delayMs, ref, input);
    },
    async runAt(timestamp, ref, input) {
      return (await resolve()).runAt(timestamp, ref, input);
    },
    async cancel(scheduledId) {
      return (await resolve()).cancel(scheduledId);
    },
  };
}

/**
 * Session resolution is memoized per-request (React cache). Multiple Aura
 * operations within the same RSC render (e.g. 5 Shell components fetching
 * different queries) would otherwise re-parse the cookie, re-hash the token,
 * re-select `AuraSession join AuraUser`, and re-write `lastUsedAt` for each
 * call. With this cache, the second+ caller reuses the resolved session.
 */
const resolveSessionCached = cache(
  async (cookieHeader: string | null) => {
    if (!cookieHeader) return { session: null, user: null };
    const request = new Request("http://aura.local/session", {
      headers: { cookie: cookieHeader },
    });
    return resolveSessionFromRequest(db, request);
  },
);

export interface CreateAuraContextOptions {
  request?: Request;
  source: AuraSource;
  requestId?: string;
}

export async function createAuraContext(
  options: CreateAuraContextOptions,
): Promise<AuraContext> {
  const requestId = options.requestId ?? uuidv4();
  const log = createAuraLogger(requestId);
  const bumps = createBumpStore();
  const hasSessionCookie = options.request
    ? Boolean(parseCookieHeader(options.request.headers.get("cookie")).get(sessionCookieName()))
    : false;
  const cookieHeader = options.request?.headers.get("cookie") ?? null;
  const resolvedSession = options.request
    ? await resolveSessionCached(cookieHeader)
    : { session: null, user: null };
  const cookieMutations: AuraContext["cookies"]["set"] = [];

  if (hasSessionCookie && !resolvedSession.session) {
    cookieMutations.push({
      name: sessionCookieName(),
      value: "",
      options: {
        httpOnly: true,
        secure: isSecureCookieEnvironment(),
        sameSite: getSameSite(),
        path: "/",
        maxAge: 0,
      },
    });
  }

  // Lazy-loaded `runOperation` — defined here to avoid a circular import
  // with `runner.ts` which also creates contexts.
  async function runOperation<TInput, TOutput>(
    ref: OperationRef | string,
    input: TInput,
  ): Promise<TOutput> {
    const { getOperation } = await import("./registry");
    const name = typeof ref === "string" ? ref : ref._name;
    const operation = getOperation(name);
    if (!operation) {
      const { AuraError } = await import("@/aura/core/errors");
      throw new AuraError("NOT_FOUND", `Opération Aura introuvable: ${name}`);
    }

    const out = await operation.execute({
      ctx,
      input,
      params: undefined,
      req: options.request,
    });

    return out as TOutput;
  }

  const readKeys = new Set<string>();
  const writeKeys = new Set<string>();
  const sink: TrackSink = {
    addRead: (k) => readKeys.add(k),
    addWrite: (k) => writeKeys.add(k),
  };

  const ctx: AuraContext = {
    db: createTrackedDb(db, sink),
    session: resolvedSession.session,
    user: resolvedSession.user,
    auth: {
      setSessionCookie(token, expiresAt) {
        cookieMutations.push({
          name: sessionCookieName(),
          value: token,
          options: {
            httpOnly: true,
            secure: isSecureCookieEnvironment(),
            sameSite: getSameSite(),
            path: "/",
            expires: expiresAt,
          },
        });
      },
      clearSessionCookie() {
        cookieMutations.push({
          name: sessionCookieName(),
          value: "",
          options: {
            httpOnly: true,
            secure: isSecureCookieEnvironment(),
            sameSite: getSameSite(),
            path: "/",
            maxAge: 0,
          },
        });
      },
    },
    notify: createNotificationDispatcher(() => ctx),
    bump: bumps,
    log,
    audit: {
      async record(action, metadata) {
        await db.auraAuditLog.create({
          data: {
            actorUserId: ctx.user?.id ?? null,
            action,
            operation:
              typeof metadata?.operation === "string"
                ? metadata.operation
                : null,
            requestId,
            source: options.source,
            metadata: toPrismaJson(metadata),
          },
        });
      },
    },
    requestId,
    source: options.source,
    request: {
      ip: options.request?.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
      userAgent: options.request?.headers.get("user-agent") ?? undefined,
      origin: options.request?.headers.get("origin") ?? undefined,
      countryCode: options.request?.headers.get("cf-ipcountry") ?? undefined,
    },
    cookies: {
      set: cookieMutations,
    },
    storage: createAuraStorage(),
    scheduler: createLazyScheduler(),
    agent: createLazyAgent(),
    // Typed `api` object refs — see `core/types.ts` for the OperationRef
    // contract. String names are accepted for backward compatibility.
    runQuery: runOperation as AuraContext["runQuery"],
    runMutation: runOperation as AuraContext["runMutation"],
    runAction: runOperation as AuraContext["runAction"],
    async paginate(model, opts) {
      const { paginate: paginateFn } = await import("./pagination");
      return paginateFn(
        model as unknown as { findMany: (args: never) => Promise<unknown> },
        {
          ...opts,
          operationHash: opts.operationHash ?? "anonymous",
        },
      ) as never;
    },
    track(input) {
      input.read?.forEach((k) => readKeys.add(k));
      input.write?.forEach((k) => writeKeys.add(k));
    },
    readKeys,
    writeKeys,
    // Default `fetch` for actions (queries/mutations should not use it,
    // but exposing it on the union surface keeps the runtime simple).
    fetch: globalThis.fetch.bind(globalThis),
  };

  return ctx;
}
