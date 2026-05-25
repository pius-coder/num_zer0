import type { AuraContext, AuraSource } from "./context";
import { createAuraContext } from "./create-context";
import { AuraError } from "@/aura/core/errors";
import { internalSecretHeaderName, verifyInternalSecret } from "./middleware/auth";
export { defineHttpAction, listHttpActions } from "@aura/http-actions";
export type { HttpActionDefinition } from "@aura/http-actions";

export async function runHttpAction(
  definition: HttpActionDefinition<AuraContext>,
  request: Request,
  source: AuraSource = "bridge",
): Promise<Response> {
  const ctx = await createAuraContext({ request, source });

  if (definition.access === "auth" && !ctx.session) {
    throw new AuraError("UNAUTHORIZED", "Authentification requise.");
  }
  if (definition.access === "internal") {
    const secretHeader = request.headers.get(internalSecretHeaderName) ?? undefined;
    if (!verifyInternalSecret(secretHeader)) {
      throw new AuraError("FORBIDDEN", "Endpoint interne.");
    }
  }

  return definition.handler(ctx, request);
}
