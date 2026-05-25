export interface WsClient {
  send: (data: string) => void;
  lastPong: number;
}

export interface InvalidatePayload {
  id?: string;
  keys?: unknown;
}

export interface PublishInvalidationOptions {
  keys: readonly string[];
  broadcastUrl?: string;
  signal?: AbortSignal;
  secret?: string;
}
