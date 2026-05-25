import { AuraError } from "@aura/core";

const WRITE_METHODS = new Set([
  "create", "createMany", "update", "updateMany",
  "upsert", "delete", "deleteMany",
  "$executeRaw", "$executeRawUnsafe",
]);

const READ_METHODS = new Set([
  "findMany", "findFirst", "findUnique",
  "findUniqueOrThrow", "findFirstOrThrow",
  "count", "aggregate", "groupBy",
  "$queryRaw", "$queryRawUnsafe",
  "$on", "$use", "$extends",
]);

export function createReadOnlyDb<T extends object>(client: T): T {
  return new Proxy(client, {
    get(target, prop, receiver) {
      if (typeof prop === "string" && WRITE_METHODS.has(prop)) {
        throw new AuraError("INTERNAL_ERROR", `Direct DB write forbidden in this context (attempted: ${prop})`);
      }
      return Reflect.get(target, prop, receiver);
    },
  });
}

export function isWriteMethod(method: string): boolean {
  return WRITE_METHODS.has(method);
}

export function isReadMethod(method: string): boolean {
  return READ_METHODS.has(method);
}
