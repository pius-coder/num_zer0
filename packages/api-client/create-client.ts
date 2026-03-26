import type { ClientConfig, RequestOptions } from "./types";
import { ApiClientError } from "./errors";

export function createClient(config: ClientConfig) {
  async function request<T>(
    method: string,
    path: string,
    options?: RequestOptions
  ): Promise<T> {
    const url = new URL(path, config.baseUrl);

    if (options?.params) {
      Object.entries(options.params).forEach(([k, v]) =>
        url.searchParams.set(k, v)
      );
    }

    const res = await fetch(url.toString(), {
      method,
      headers: {
        "Content-Type": "application/json",
        ...config.headers,
        ...options?.headers,
      },
      body: options?.body ? JSON.stringify(options.body) : undefined,
    });

    if (!res.ok) {
      const error = new ApiClientError(res.status, res.statusText);
      config.onError?.(error);
      throw error;
    }

    return res.json() as T;
  }

  return {
    get: <T>(path: string, params?: Record<string, string>) =>
      request<T>("GET", path, { params }),
    post: <T>(path: string, body?: unknown) =>
      request<T>("POST", path, { body }),
    put: <T>(path: string, body?: unknown) =>
      request<T>("PUT", path, { body }),
    patch: <T>(path: string, body?: unknown) =>
      request<T>("PATCH", path, { body }),
    delete: <T>(path: string) => request<T>("DELETE", path),
  };
}
