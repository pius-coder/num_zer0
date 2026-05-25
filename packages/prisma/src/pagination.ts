export interface PaginateOptions {
  take: number;
  cursor?: string;
  orderBy?: "asc" | "desc";
  orderField?: string;
}

export interface PaginatedResult<T> {
  items: T[];
  hasMore: boolean;
  nextCursor: string | null;
}

function toBase64Url(id: string): string {
  if (typeof btoa === "function") {
    return btoa(id).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }
  return Buffer.from(id).toString("base64url");
}

function fromBase64Url(str: string): string {
  if (typeof atob === "function") {
    return atob(str.replace(/-/g, "+").replace(/_/g, "/"));
  }
  return Buffer.from(str, "base64url").toString("utf-8");
}

export function encodeCursor(id: string): string {
  return toBase64Url(id);
}

export function decodeCursor(cursor: string): string {
  return fromBase64Url(cursor);
}

export async function paginate<T extends { id: string }>(
  findMany: (args: { take: number; skip?: number; cursor?: { id: string }; orderBy?: Record<string, "asc" | "desc"> }) => Promise<T[]>,
  options: PaginateOptions,
): Promise<PaginatedResult<T>> {
  const take = Math.min(options.take, 100);
  const orderField = options.orderField ?? "id";
  const orderBy = { [orderField]: options.orderBy ?? "desc" } as Record<string, "asc" | "desc">;

  const args: Parameters<typeof findMany>[0] = {
    take: take + 1,
    orderBy,
  };

  if (options.cursor) {
    args.cursor = { id: decodeCursor(options.cursor) };
    args.skip = 1;
  }

  const items = await findMany(args);
  const hasMore = items.length > take;
  const result = hasMore ? items.slice(0, take) : items;

  return {
    items: result,
    hasMore,
    nextCursor: hasMore ? encodeCursor(result[result.length - 1]!.id) : null,
  };
}

export { toBase64Url, fromBase64Url };
