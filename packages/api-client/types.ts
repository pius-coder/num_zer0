export type ClientConfig = {
  baseUrl: string;
  headers?: Record<string, string>;
  onError?: (error: Error) => void;
};

export type RequestOptions = {
  params?: Record<string, string>;
  body?: unknown;
  headers?: Record<string, string>;
};
