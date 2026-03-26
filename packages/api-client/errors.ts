export class ApiClientError extends Error {
  constructor(
    public readonly status: number,
    public readonly statusText: string,
    public readonly body?: unknown
  ) {
    super(`API Error ${status}: ${statusText}`);
    this.name = "ApiClientError";
  }
}
