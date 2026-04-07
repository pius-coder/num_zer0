DROP TABLE IF EXISTS provider_service_cost CASCADE;
DROP TABLE IF EXISTS sub_provider_cost CASCADE;

CREATE TABLE IF NOT EXISTS price_override (
    id TEXT PRIMARY KEY,
    service_slug TEXT NOT NULL,
    country_iso TEXT NOT NULL,
    price_credits INTEGER NOT NULL,
    floor_credits INTEGER,
    note TEXT,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
    CONSTRAINT price_override_unique UNIQUE (service_slug, country_iso)
);

CREATE INDEX IF NOT EXISTS price_override_slug_idx ON price_override (service_slug);
CREATE INDEX IF NOT EXISTS price_override_iso_idx ON price_override (country_iso);