import type { AuraAuthContext, AuraPlugin } from "@aura/core";
import { createAuthPluginOperations } from "./operations";
import { csrfCookieName, isSecureCookieEnvironment, getSameSite, sessionCookieName } from "./cookies";

export interface AuthPluginConfig {
  db: {
    auraUser: any;
    auraPhoneIdentity: any;
    auraPasswordCredential: any;
    auraSession: any;
    auraOtpChallenge: any;
    $transaction?: any;
  };
}

export function createAuthPlugin(config: AuthPluginConfig): AuraPlugin {
  return {
    name: "@aura/auth",
    version: "0.0.0",
    async setup(ctx) {
      const ops = createAuthPluginOperations(config.db);

      ctx.operations.register(ops.authRegister as any);
      ctx.operations.register(ops.authLogin as any);
      ctx.operations.register(ops.authLogout as any);
      ctx.operations.register(ops.authMe as any);

      ctx.context.extend(async (baseCtx) => {
        const { resolveSessionFromRequest } = await import("./session");
        const request = baseCtx.rawRequest;
        const resolved = request
          ? await resolveSessionFromRequest(config.db as any, request)
          : { session: null, user: null };

        const auth: AuraAuthContext = {
          setSessionCookie(token, expiresAt) {
            baseCtx.cookies.set.push({
              name: sessionCookieName(),
              value: token,
              options: {
                httpOnly: true,
                secure: isSecureCookieEnvironment(),
                sameSite: getSameSite(),
                path: "/",
                maxAge: 30 * 24 * 60 * 60,
                expires: expiresAt,
              },
            });
          },
          clearSessionCookie() {
            baseCtx.cookies.set.push({
              name: sessionCookieName(),
              value: "",
              options: {
                httpOnly: true,
                secure: isSecureCookieEnvironment(),
                sameSite: getSameSite(),
                path: "/",
                maxAge: 0,
                expires: new Date(0),
              },
            });
            baseCtx.cookies.set.push({
              name: csrfCookieName(),
              value: "",
              options: {
                httpOnly: false,
                secure: isSecureCookieEnvironment(),
                sameSite: getSameSite(),
                path: "/",
                maxAge: 0,
                expires: new Date(0),
              },
            });
          },
          resolveSession: (nextRequest) => resolveSessionFromRequest(config.db as any, nextRequest),
        };

        return { auth, session: resolved.session, user: resolved.user };
      });
    },
  };
}
