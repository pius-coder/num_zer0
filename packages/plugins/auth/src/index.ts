import type { AuraPlugin } from "@aura/core";
import { createAuthPluginOperations } from "./operations";

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

      ctx.context.extend("auth", () => ({
        resolveSession: async (request: Request) => {
          const { resolveSessionFromRequest } = await import("./session");
          return resolveSessionFromRequest(config.db as any, request);
        },
      }));
    },
  };
}
