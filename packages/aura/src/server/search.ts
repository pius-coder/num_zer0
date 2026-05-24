import { db } from "./db";
import type { AuraDb } from "./db";

export interface SearchIndexDefinition {
  model: string;
  fields: string[];
  filterFields?: string[];
  language?: string;
  handler?: (args: { ctx: unknown; query: string; filters?: Record<string, unknown> }) => Promise<unknown>;
}

const searchIndexes = new Map<string, SearchIndexDefinition>();

export function getSearchIndex(model: string): SearchIndexDefinition | null {
  return searchIndexes.get(model) ?? null;
}

export function listSearchIndexes(): SearchIndexDefinition[] {
  return [...searchIndexes.values()];
}

interface SearchIndexBuilder {
  fields(f: string[]): this & { handler(h: SearchIndexDefinition["handler"]): SearchIndexDefinition };
  filterFields(ff: string[]): this & { handler(h: SearchIndexDefinition["handler"]): SearchIndexDefinition };
  language(l: string): this & { handler(h: SearchIndexDefinition["handler"]): SearchIndexDefinition };
  handler(h: SearchIndexDefinition["handler"]): SearchIndexDefinition;
}

export function defineSearchIndex(model: string): SearchIndexBuilder {
  const state: Partial<SearchIndexDefinition> = { model };

  const finalize = () => {
    const def: SearchIndexDefinition = {
      model,
      fields: state.fields ?? [],
      filterFields: state.filterFields,
      language: state.language,
      handler: state.handler,
    };
    searchIndexes.set(model, def);
    return def;
  };

  const builder = {
    fields(f: string[]) {
      state.fields = f;
      return builder;
    },
    filterFields(ff: string[]) {
      state.filterFields = ff;
      return builder;
    },
    language(l: string) {
      state.language = l;
      return builder;
    },
    handler(h: SearchIndexDefinition["handler"]) {
      state.handler = h;
      return finalize();
    },
  };

  return builder as SearchIndexBuilder;
}

export function generateSearchIndexSQL(def: SearchIndexDefinition): string {
  const lang = def.language ?? "english";
  const weights = def.fields.map((f, i) => {
    const weight = i === 0 ? "A" : "B";
    return `setweight(to_tsvector('${lang}', coalesce("${f}", '')), '${weight}')`;
  });

  return [
    `-- Full-text search index for ${def.model}`,
    `ALTER TABLE "${def.model}" ADD COLUMN IF NOT EXISTS "search_vector" tsvector`,
    `  GENERATED ALWAYS AS (${weights.join(" || ")}) STORED;`,
    ``,
    `CREATE INDEX IF NOT EXISTS "${def.model}_search_idx"`,
    `  ON "${def.model}" USING GIN ("search_vector");`,
  ].join("\n");
}

export interface SearchOptions {
  query: string;
  filter?: Record<string, unknown>;
  limit?: number;
  offset?: number;
}

export interface SearchResult<T> {
  items: T[];
  scores: number[];
}

export async function search<T = unknown>(
  model: string,
  options: SearchOptions,
  prisma: AuraDb = db,
): Promise<SearchResult<T>> {
  const def = searchIndexes.get(model);
  if (!def) {
    throw new Error(`[aura:search] No search index registered for model "${model}"`);
  }

  const lang = def.language ?? "english";
  const limit = options.limit ?? 20;
  const offset = options.offset ?? 0;

  const filterClauses: string[] = [];
  const filterValues: unknown[] = [];
  let paramIdx = 2;

  if (options.filter) {
    for (const [key, value] of Object.entries(options.filter)) {
      if (def.filterFields?.includes(key) && value !== undefined) {
        filterClauses.push(`"${key}" = $${paramIdx}`);
        filterValues.push(value);
        paramIdx++;
      }
    }
  }

  const whereFilter = filterClauses.length > 0
    ? `AND ${filterClauses.join(" AND ")}`
    : "";

  const sql = `
    SELECT *, ts_rank("search_vector", plainto_tsquery('${lang}', $1)) as _score
    FROM "${model}"
    WHERE "search_vector" @@ plainto_tsquery('${lang}', $1)
    ${whereFilter}
    ORDER BY _score DESC
    LIMIT ${limit} OFFSET ${offset}
  `;

  const rows = await prisma.$queryRawUnsafe(sql, options.query, ...filterValues) as Array<T & { _score: number }>;

  return {
    items: rows.map(({ _score, ...rest }) => rest as unknown as T),
    scores: rows.map((r) => r._score),
  };
}
