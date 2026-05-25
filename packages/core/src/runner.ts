import { errorEnvelope, successEnvelope, type AuraEnvelope } from "./envelope";
import { AuraError, toPublicAuraError } from "./errors";
import type { RegisteredAuraOperation } from "./operation";
import type { AuraContext } from "./context";

export interface CoreRunOptions {
  operation: RegisteredAuraOperation;
  ctx: AuraContext;
  input: unknown;
  params?: unknown;
}

export async function coreRunOperation<TData = unknown>(
  options: CoreRunOptions,
): Promise<{ envelope: AuraEnvelope<TData>; status: number }> {
  const { operation, ctx, input, params } = options;

  try {
    if (operation.access === "internal" && ctx.source === "bridge") {
      throw new AuraError("FORBIDDEN", "This operation is internal.");
    }

    const data = (await operation.execute({ ctx, input, params })) as TData;

    return {
      envelope: successEnvelope({
        data,
        requestId: ctx.requestId,
        bumps: [],
        invalidates: [],
        refresh: false,
      }),
      status: 200,
    };
  } catch (error) {
    const auraError = toPublicAuraError(error);

    if (!(error instanceof AuraError)) {
      ctx.log.error("Unhandled Aura operation error", {
        operation: operation.name,
        error: error instanceof Error ? (error.stack ?? error.message) : String(error),
      });
    }

    return {
      envelope: errorEnvelope({ error: auraError, requestId: ctx.requestId }),
      status: auraError.status,
    };
  }
}
