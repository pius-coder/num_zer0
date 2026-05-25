export function toPrismaJson(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value === "bigint") return value.toString();
  if (typeof value === "function" || typeof value === "symbol") return undefined;
  if (value instanceof Error) return { message: value.message, stack: value.stack };
  if (Array.isArray(value)) return value.map(toPrismaJson);
  if (typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      result[k] = toPrismaJson(v);
    }
    return result;
  }
  return value;
}
