export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
export type HttpAccess = "auth" | "public" | "internal";

export interface HttpActionDefinition<TCtx extends unknown = unknown> {
  readonly __auraHttpAction: true;
  readonly path: string;
  readonly method: HttpMethod;
  readonly access: HttpAccess;
  readonly csrf: boolean;
  readonly handler: (ctx: TCtx, request: Request) => Promise<Response> | Response;
}
