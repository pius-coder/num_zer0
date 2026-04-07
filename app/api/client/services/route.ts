import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { handleError } from "@/middleware/error-handler";
import {
  extractRequestContext,
  withUser,
  toAuditEntry,
} from "@/middleware/request-context";
import { rateLimit, getClientKey } from "@/middleware/rate-limit";
import { requireSession } from "@/common/auth/api-auth.server";
import { createLogger } from "@/common/logger";
import { db } from "@/database";
import { priceOverride } from "@/database/schema";
import {
  getServiceBySlug,
  getAllServices,
  searchServices,
  getServicesByCategory,
  type ServiceCategory,
  type ServiceMeta,
} from "@/common/catalog";

// Extended service type with price information
type ServiceWithPrices = ServiceMeta & {
  hasPrices: boolean;
  countryCount: number;
};

const log = createLogger({ prefix: "api-client-services" });

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

export async function GET(req: Request) {
  const ctx = extractRequestContext(req);

  try {
    const session = await requireSession();
    const authed = withUser(ctx, session.user.id);

    const key = getClientKey(session.user.id, req);
    const { allowed, retryAfterMs } = rateLimit(key);
    if (!allowed) {
      return NextResponse.json(
        { error: "rate_limited", message: "Too many requests" },
        {
          status: 429,
          headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) },
        },
      );
    }

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category") || null;
    const q = searchParams.get("q") || "";
    const cursor = searchParams.get("cursor") || null;
    const limit = Math.min(
      MAX_LIMIT,
      Math.max(
        1,
        Number.parseInt(searchParams.get("limit") || String(DEFAULT_LIMIT), 10),
      ),
    );

    // Shadow pricing: count overrides per service instead of price_rule
    let rulesMap: Map<string, { hasPrices: boolean; countryCount: number }> = new Map();
    try {
      rulesMap = await db
        .select({
          slug: priceOverride.serviceSlug,
          countryCount: sql<number>`count(distinct ${priceOverride.countryIso})`,
        })
        .from(priceOverride)
        .groupBy(priceOverride.serviceSlug)
        .then((rows) => {
          const map = new Map<string, { hasPrices: boolean; countryCount: number }>();
          for (const row of rows) {
            map.set(row.slug, {
              hasPrices: true,
              countryCount: Number(row.countryCount),
            });
          }
          return map;
        });
    } catch {
      // Table doesn't exist yet (migration not run)
      log.warn('price_override_table_missing', {});
    }

    let services = getAllServices();

    if (category && category !== "all") {
      services = getServicesByCategory(category as ServiceCategory);
    }

    if (q.trim()) {
      const searched = searchServices(q);
      const searchedSlugs = new Set(searched.map((s) => s.slug));
      services = services.filter((s) => searchedSlugs.has(s.slug));
    }

    const servicesWithPrices: ServiceWithPrices[] = services.map((svc) => {
      const rule = rulesMap.get(svc.slug);
      return {
        ...svc,
        hasPrices: rule?.hasPrices ?? false,
        countryCount: rule?.countryCount ?? 0,
      };
    });

    servicesWithPrices.sort((a, b) => {
      if (a.hasPrices !== b.hasPrices) return a.hasPrices ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

    const total = servicesWithPrices.length;

    let offset = 0;
    if (cursor) {
      const cursorIdx = services.findIndex((s) => s.slug === cursor);
      if (cursorIdx !== -1) offset = cursorIdx + 1;
    }

    const slice = servicesWithPrices.slice(offset, offset + limit);
    const lastItem = slice[slice.length - 1];
    const nextCursor =
      lastItem && offset + limit < total ? lastItem.slug : null;

    const items = slice.map((svc) => ({
      slug: svc.slug,
      name: svc.name,
      category: svc.category,
      icon: svc.icon ?? null,
      hasPrices: svc.hasPrices,
      countryCount: svc.countryCount,
    }));

    log.info("services_listed", {
      ...toAuditEntry(authed, "list", "services", "success"),
      count: items.length,
      total,
      cursor,
      nextCursor,
    });

    return NextResponse.json(
      { items, total, nextCursor },
      { headers: { "Cache-Control": "private, max-age=30" } },
    );
  } catch (err) {
    return handleError(err, ctx.requestId);
  }
}
