import type {
  PaginationOptions,
  PaginatedResult,
  FlatPriceV3Row,
  PriceV3FilterOptions,
  GrizzlyServiceItem,
  GrizzlyCountryItem,
  ServiceFilterOptions,
  CountryFilterOptions,
  PricesV3Raw,
} from './types';

// ─── Pagination ───────────────────────────────────────────────────────────────

export function paginate<T>(
  items: T[],
  options: PaginationOptions = {}
): PaginatedResult<T> {
  const page = Math.max(1, options.page ?? 1);
  const pageSize = Math.max(1, options.pageSize ?? 50);
  const totalItems = items.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const data = items.slice(start, start + pageSize);

  return {
    data,
    page: safePage,
    pageSize,
    totalItems,
    totalPages,
    hasNext: safePage < totalPages,
    hasPrev: safePage > 1,
  };
}

// ─── Normalise raw API data into flat rows ────────────────────────────────────

export function flattenPricesV3(raw: PricesV3Raw): FlatPriceV3Row[] {
  const rows: FlatPriceV3Row[] = [];
  for (const country of Object.keys(raw)) {
    const countryData = raw[country];
    if (!countryData) continue;
    for (const service of Object.keys(countryData)) {
      const entry = countryData[service];
      if (!entry) continue;
      rows.push({
        country,
        service,
        price: entry.price,
        count: entry.count,
        providers: Object.values(entry.providers ?? {}),
      });
    }
  }
  return rows;
}

// ─── Filters ──────────────────────────────────────────────────────────────────

function matchStringFilter(value: string, filter?: string | string[]): boolean {
  if (!filter) return true;
  const values = Array.isArray(filter) ? filter : [filter];
  return values.includes(value);
}

function matchQuery(value: string, query?: string): boolean {
  if (!query) return true;
  return value.toLowerCase().includes(query.toLowerCase());
}

export function filterPricesV3(
  rows: FlatPriceV3Row[],
  filters: PriceV3FilterOptions
): FlatPriceV3Row[] {
  return rows.filter((r) => {
    if (!matchStringFilter(r.country, filters.country)) return false;
    if (!matchStringFilter(r.service, filters.service)) return false;
    if (filters.minCost !== undefined && r.price < filters.minCost) return false;
    if (filters.maxCost !== undefined && r.price > filters.maxCost) return false;
    if (filters.minCount !== undefined && r.count < filters.minCount) return false;
    if (filters.providerId !== undefined) {
      const hasProvider = r.providers.some((p) => p.provider_id === filters.providerId);
      if (!hasProvider) return false;
    }
    if (filters.minProviderCount !== undefined) {
      const qualified = r.providers.filter((p) => p.count >= filters.minProviderCount!);
      if (qualified.length === 0) return false;
    }
    return true;
  });
}

export function filterServices(
  services: GrizzlyServiceItem[],
  filters: ServiceFilterOptions
): GrizzlyServiceItem[] {
  return services.filter((s) => {
    if (filters.codes && !filters.codes.includes(s.code)) return false;
    if (
      filters.query &&
      !matchQuery(s.name, filters.query) &&
      !matchQuery(s.code, filters.query)
    )
      return false;
    return true;
  });
}

export function filterCountries(
  countries: GrizzlyCountryItem[],
  filters: CountryFilterOptions
): GrizzlyCountryItem[] {
  return countries.filter((c) => {
    if (filters.ids && !filters.ids.includes(c.id)) return false;
    if (
      filters.query &&
      !matchQuery(c.eng, filters.query) &&
      !matchQuery(c.rus, filters.query)
    )
      return false;
    return true;
  });
}

// ─── Sort helpers ─────────────────────────────────────────────────────────────

export type SortOrder = 'asc' | 'desc';

export function sortBy<T>(
  items: T[],
  key: keyof T,
  order: SortOrder = 'asc'
): T[] {
  return [...items].sort((a, b) => {
    const av = a[key] as unknown;
    const bv = b[key] as unknown;
    if (typeof av === 'number' && typeof bv === 'number') {
      return order === 'asc' ? av - bv : bv - av;
    }
    const as = String(av);
    const bs = String(bv);
    return order === 'asc' ? as.localeCompare(bs) : bs.localeCompare(as);
  });
}
