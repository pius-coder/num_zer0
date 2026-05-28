import type { PrismaClient } from "@/generated/prisma/client";

export const READ_METHODS = new Set([
  "findMany",
  "findFirst",
  "findUnique",
  "findUniqueOrThrow",
  "findFirstOrThrow",
  "count",
  "aggregate",
  "groupBy",
]);

export interface TrackSink {
  addRead(key: string): void;
  addWrite(key: string): void;
}

function pascal(model: string): string {
  return model.charAt(0).toUpperCase() + model.slice(1);
}

function toRows(result: unknown): unknown[] {
  if (Array.isArray(result)) return result;
  if (result && typeof result === "object") return [result];
  return [];
}

function trackMethod(model: string, method: string, fn: Function, sink: TrackSink) {
  return async (args: Record<string, unknown>) => {
    const result = await fn(args);
    const M = pascal(model);

    if (READ_METHODS.has(method)) {
      if (method.startsWith("findUnique")) {
        if ((args as Record<string, unknown>)?.where && typeof (args as Record<string, unknown>).where === "object") {
          const where = args.where as Record<string, unknown>;
          if (where.id) sink.addRead(`${M}:${where.id}`);
          else sink.addRead(M);
        } else {
          sink.addRead(M);
        }
      } else if (method === "count" || method === "aggregate" || method === "groupBy") {
        sink.addRead(M);
      } else {
        sink.addRead(M);
        for (const row of toRows(result)) {
          if (row && typeof row === "object" && "id" in row) {
            sink.addRead(`${M}:${(row as Record<string, unknown>).id}`);
          }
        }
      }
    } else if (method === "update" || method === "upsert" || method === "delete") {
      sink.addWrite(M);
      const id =
        (args as Record<string, unknown>)?.where &&
        typeof (args as Record<string, unknown>).where === "object"
          ? ((args.where as Record<string, unknown>).id as string | undefined)
          : undefined;
      if (id) sink.addWrite(`${M}:${id}`);
    } else if (method === "create") {
      sink.addWrite(M);
      if (result && typeof result === "object" && "id" in result) {
        sink.addWrite(`${M}:${(result as Record<string, unknown>).id}`);
      }
    } else if (
      method === "createMany" ||
      method === "updateMany" ||
      method === "deleteMany"
    ) {
      sink.addWrite(M);
    }
    return result;
  };
}

// The tracked db only OBSERVES reads/writes — it never blocks. Write
// protection for queries is layered on separately via `createReadOnlyDb`
// (applied by the runner only for query operations). Mutations get the
// tracked db directly and must retain access to `$transaction`,
// `$executeRaw*`, etc.

function wrapDelegate(modelName: string, delegate: object, sink: TrackSink): object {
  return new Proxy(delegate, {
    get(target, prop, receiver) {
      if (typeof prop !== "string") {
        return Reflect.get(target, prop, receiver);
      }
      const value = Reflect.get(target, prop, receiver);
      if (typeof value !== "function") return value;
      return trackMethod(modelName, prop, value as Function, sink);
    },
  });
}

export function createTrackedDb(client: PrismaClient, sink: TrackSink): PrismaClient {
  return new Proxy(client, {
    get(target, prop, receiver) {
      if (typeof prop !== "string") {
        return Reflect.get(target, prop, receiver);
      }
      const raw = Reflect.get(target, prop, receiver);
      if (raw && typeof raw === "object" && /^[a-z]/.test(prop)) {
        return wrapDelegate(prop, raw, sink);
      }
      return raw;
    },
  }) as PrismaClient;
}
