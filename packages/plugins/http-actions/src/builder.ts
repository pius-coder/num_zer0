import type { HttpMethod, HttpAccess, HttpActionDefinition } from "./types";

const httpActionRegistry: HttpActionDefinition[] = [];

export function listHttpActions(): readonly HttpActionDefinition[] {
  return httpActionRegistry;
}

interface FinalStage<TCtx extends unknown = unknown> {
  handler(
    fn: (ctx: TCtx, request: Request) => Promise<Response> | Response,
  ): HttpActionDefinition<TCtx>;
}

interface AccessStage<TCtx extends unknown = unknown> extends FinalStage<TCtx> {
  csrf(enabled: boolean): AccessStage<TCtx>;
}

interface RootStage<TCtx extends unknown = unknown> {
  auth(): AccessStage<TCtx>;
  public(): AccessStage<TCtx>;
  internal(): AccessStage<TCtx>;
}

export function defineHttpAction<TCtx extends unknown = unknown>(
  path: string,
  method: HttpMethod,
): RootStage<TCtx> {
  const state: {
    path: string;
    method: HttpMethod;
    access: HttpAccess | null;
    csrf: boolean;
  } = { path, method, access: null, csrf: false };

  function makeFinal(): AccessStage<TCtx> {
    return {
      csrf(enabled: boolean) {
        state.csrf = enabled;
        return makeFinal();
      },
      handler(fn) {
        if (!state.access) {
          throw new Error(
            `[aura] HTTP action ${state.method} ${state.path} is missing .auth() / .public() / .internal()`,
          );
        }
        const definition: HttpActionDefinition<TCtx> = {
          __auraHttpAction: true,
          path: state.path,
          method: state.method,
          access: state.access,
          csrf: state.csrf,
          handler: fn,
        };
        httpActionRegistry.push(definition as HttpActionDefinition);
        return definition;
      },
    };
  }

  return {
    auth() {
      state.access = "auth";
      return makeFinal();
    },
    public() {
      state.access = "public";
      return makeFinal();
    },
    internal() {
      state.access = "internal";
      return makeFinal();
    },
  };
}
