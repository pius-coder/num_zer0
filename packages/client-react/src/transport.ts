import type { AuraEnvelope } from "@aura/core";

export interface AuraClientConfig {
  baseUrl: string;
  fetch: typeof globalThis.fetch;
}

let config: AuraClientConfig = {
  baseUrl: "",
  fetch: globalThis.fetch,
};

export function configureAura(opts: Partial<AuraClientConfig>): void {
  if (opts.baseUrl !== undefined) config.baseUrl = opts.baseUrl;
  if (opts.fetch !== undefined) config.fetch = opts.fetch;
}

export function getAuraClientConfig(): AuraClientConfig {
  return config;
}

function operationUrl(name: string): string {
  const path = name.replace(/\./g, "/");
  return `${config.baseUrl}/aura/${path}`;
}

export async function fetchManifest(): Promise<{ operations: Array<{ name: string; type: string }> }> {
  const res = await config.fetch(`${config.baseUrl}/manifest`);
  return res.json();
}

export async function callAura<TData = unknown>(
  operationName: string,
  input: unknown,
): Promise<AuraEnvelope<TData>> {
  const res = await config.fetch(operationUrl(operationName), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input ?? {}),
  });

  const envelope: AuraEnvelope<TData> = await res.json();

  // CSRF auto-heal: re-fetch manifest to reissue CSRF cookie, then retry once
  if (!envelope.ok && envelope.error.code === "FORBIDDEN") {
    await fetchManifest();
    const retry = await config.fetch(operationUrl(operationName), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input ?? {}),
    });
    return retry.json();
  }

  return envelope;
}

export class AuraClientError extends Error {
  readonly code: string;
  readonly status: number;
  readonly fieldErrors?: Record<string, string[]>;

  constructor(envelope: { error: { code: string; message: string; status: number; fieldErrors?: Record<string, string[]> } }) {
    super(envelope.error.message);
    this.name = "AuraClientError";
    this.code = envelope.error.code;
    this.status = envelope.error.status;
    this.fieldErrors = envelope.error.fieldErrors;
  }
}
