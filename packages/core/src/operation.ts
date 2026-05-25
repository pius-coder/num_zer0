import { z } from "zod";
import { AuraError, type AuraFieldErrors } from "./errors";
import type { OperationType, OperationAccess, EntityTag } from "./types";
import type { AuraContext } from "./context";

export type { OperationType, OperationAccess, EntityTag };

export interface CommonFnArgs<TInput, TParams, TCtx extends AuraContext = AuraContext> {
  ctx: TCtx;
  input: TInput;
  params: TParams;
  operation: RegisteredAuraOperation;
}

export interface DefinedCommonFn<TInput = unknown, TParams = unknown, TCtx extends AuraContext = AuraContext> {
  readonly __auraCommon: true;
  readonly name: string;
  readonly run: (args: CommonFnArgs<TInput, TParams, TCtx>) => Promise<void> | void;
}

export interface HandlerArgs<TInput, TParams, TCtx extends AuraContext = AuraContext> {
  ctx: TCtx;
  input: TInput;
  params: TParams;
  req?: Request;
}

export type OperationHandler<TInput, TParams, TOutput, TCtx extends AuraContext = AuraContext> = (
  args: HandlerArgs<TInput, TParams, TCtx>,
) => Promise<TOutput> | TOutput;

export interface AuraOperation<
  TInput = unknown,
  TParams = unknown,
  TOutput = unknown,
  TName extends string = string,
> {
  readonly __auraOperation: true;
  readonly name: TName;
  readonly type: OperationType;
  readonly access: OperationAccess;
  readonly inputSchema: z.ZodType<TInput> | null;
  readonly paramsSchema: z.ZodType<TParams> | null;
  readonly entities: readonly EntityTag[];
  readonly commonFns: readonly DefinedCommonFn[];
  readonly handler: OperationHandler<TInput, TParams, TOutput>;
  readonly _input?: TInput;
  readonly _output?: TOutput;
  execute(args: { ctx: AuraContext; input: unknown; params?: unknown; req?: Request }): Promise<TOutput>;
}

export interface RegisteredAuraOperation {
  readonly __auraOperation: true;
  readonly name: string;
  readonly type: OperationType;
  readonly access: OperationAccess;
  readonly inputSchema: z.ZodType | null;
  readonly paramsSchema: z.ZodType | null;
  readonly entities: readonly EntityTag[];
  readonly commonFns: readonly DefinedCommonFn[];
  execute(args: { ctx: AuraContext; input: unknown; params?: unknown; req?: Request }): Promise<unknown>;
}

export type { InferOperationInput, InferOperationOutput } from "./types";

interface BuilderState<TInput, TParams, TName extends string> {
  name: TName;
  type: OperationType | null;
  access: OperationAccess | null;
  inputSchema: z.ZodType<TInput> | null;
  paramsSchema: z.ZodType<TParams> | null;
  entities: EntityTag[];
  commonFns: DefinedCommonFn[];
}

function createState<TName extends string>(name: TName): BuilderState<void, void, TName> {
  return { name, type: null, access: null, inputSchema: null, paramsSchema: null, entities: [], commonFns: [] };
}

function sanitizeNaNs(value: unknown): unknown {
  if (typeof value === "number" && isNaN(value)) return undefined;
  if (Array.isArray(value)) return value.map(sanitizeNaNs);
  if (value && typeof value === "object") {
    const cleaned: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      cleaned[k] = sanitizeNaNs(v);
    }
    return cleaned;
  }
  return value;
}

function validateInput<TInput>(schema: z.ZodType<TInput> | null, value: unknown): TInput {
  if (!schema) return undefined as TInput;
  const sanitized = sanitizeNaNs(value);
  const parsed = schema.safeParse(sanitized);
  if (parsed.success) return parsed.data;
  throw new AuraError("VALIDATION_ERROR", "Les donnees envoyees sont invalides.", {
    fieldErrors: zodToFieldErrors(parsed.error),
  });
}

function validateParams<TParams>(schema: z.ZodType<TParams> | null, value: unknown): TParams {
  if (!schema) return undefined as TParams;
  const parsed = schema.safeParse(value ?? {});
  if (parsed.success) return parsed.data;
  throw new AuraError("VALIDATION_ERROR", "Les parametres envoyes sont invalides.", {
    fieldErrors: zodToFieldErrors(parsed.error),
  });
}

function zodToFieldErrors(error: z.ZodError): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.length > 0 ? issue.path.join(".") : "root";
    fieldErrors[key] = [...(fieldErrors[key] ?? []), issue.message];
  }
  return fieldErrors;
}

function ensureAuthenticated(ctx: AuraContext): AuraContext {
  if (!ctx.session || !ctx.user) {
    throw new AuraError("UNAUTHORIZED", "Authentication required.");
  }
  return ctx;
}

function buildOperation<TInput, TParams, TOutput, TName extends string>(
  state: BuilderState<TInput, TParams, TName>,
  handler: OperationHandler<TInput, TParams, TOutput>,
): AuraOperation<TInput, TParams, TOutput, TName> {
  if (!state.type) {
    throw new Error(`[aura] Operation "${state.name}" is missing .query() or .mutate().`);
  }
  if (!state.access) {
    throw new Error(`[aura] Operation "${state.name}" is missing .auth(), .public() or .internal().`);
  }

  const operation: AuraOperation<TInput, TParams, TOutput, TName> = {
    __auraOperation: true,
    name: state.name,
    type: state.type,
    access: state.access,
    inputSchema: state.inputSchema as z.ZodType<TInput> | null,
    paramsSchema: state.paramsSchema as z.ZodType<TParams> | null,
    entities: Object.freeze([...state.entities]),
    commonFns: Object.freeze([...state.commonFns]),
    handler,
    async execute(args) {
      const input = validateInput(state.inputSchema as z.ZodType<TInput> | null, args.input);
      const params = validateParams(state.paramsSchema as z.ZodType<TParams> | null, args.params);
      if (state.access === "auth") ensureAuthenticated(args.ctx);
      for (const commonFn of state.commonFns) {
        await commonFn.run({ ctx: args.ctx, input, params, operation });
      }
      return handler({ ctx: args.ctx, input, params, req: args.req });
    },
  };

  return operation;
}

interface AccessStage<TInput, TParams, TName extends string> {
  handler<TOutput>(handler: OperationHandler<TInput, TParams, TOutput>): AuraOperation<TInput, TParams, TOutput, TName>;
}

function makeAccessStage<TInput, TParams, TName extends string>(
  state: BuilderState<TInput, TParams, TName>,
): AccessStage<TInput, TParams, TName> {
  return {
    handler<TOutput>(handler: OperationHandler<TInput, TParams, TOutput>) {
      return buildOperation(state, handler);
    },
  };
}

interface HandlerStage<TInput, TParams, TName extends string> {
  input<TSchema extends z.ZodType>(schema: TSchema): HandlerStage<z.infer<TSchema>, TParams, TName>;
  params<TSchema extends z.ZodType>(schema: TSchema): HandlerStage<TInput, z.infer<TSchema>, TName>;
  entities(tags: readonly EntityTag[]): HandlerStage<TInput, TParams, TName>;
  use(...fns: DefinedCommonFn[]): HandlerStage<TInput, TParams, TName>;
  auth(): AccessStage<TInput, TParams, TName>;
  public(): AccessStage<TInput, TParams, TName>;
  internal(): AccessStage<TInput, TParams, TName>;
}

function makeHandlerStage<TInput, TParams, TName extends string>(
  state: BuilderState<TInput, TParams, TName>,
): HandlerStage<TInput, TParams, TName> {
  return {
    input<TSchema extends z.ZodType>(schema: TSchema) {
      const next = state as unknown as BuilderState<z.infer<TSchema>, TParams, TName>;
      next.inputSchema = schema as unknown as z.ZodType<z.infer<TSchema>>;
      return makeHandlerStage(next);
    },
    params<TSchema extends z.ZodType>(schema: TSchema) {
      const next = state as unknown as BuilderState<TInput, z.infer<TSchema>, TName>;
      next.paramsSchema = schema as unknown as z.ZodType<z.infer<TSchema>>;
      return makeHandlerStage(next);
    },
    entities(tags) {
      state.entities.push(...tags);
      return this;
    },
    use(...fns) {
      state.commonFns.push(...fns);
      return this;
    },
    auth() {
      state.access = "auth";
      return makeAccessStage(state);
    },
    public() {
      state.access = "public";
      return makeAccessStage(state);
    },
    internal() {
      state.access = "internal";
      return makeAccessStage(state);
    },
  };
}

interface RootStage<TName extends string> {
  query(): HandlerStage<void, void, TName>;
  mutate(): HandlerStage<void, void, TName>;
  action(): HandlerStage<void, void, TName>;
}

function makeRootStage<TName extends string>(state: BuilderState<void, void, TName>): RootStage<TName> {
  return {
    query() {
      state.type = "query";
      return makeHandlerStage(state);
    },
    mutate() {
      state.type = "mutate";
      return makeHandlerStage(state);
    },
    action() {
      state.type = "action";
      return makeHandlerStage(state);
    },
  };
}

export function defineOperationFn<TName extends string>(name: TName): RootStage<TName> {
  if (!/^[a-zA-Z][a-zA-Z0-9_.-]*$/.test(name)) {
    throw new Error(`[aura] Invalid operation name "${name}". Use dotted identifiers like "todo.list".`);
  }
  return makeRootStage(createState(name));
}

export function defineCommonFn<TInput = unknown, TParams = unknown>(
  name: string,
): { run(fn: (args: CommonFnArgs<TInput, TParams>) => Promise<void> | void): DefinedCommonFn<TInput, TParams> } {
  return {
    run(fn) {
      return { __auraCommon: true, name, run: fn as DefinedCommonFn["run"] };
    },
  };
}
