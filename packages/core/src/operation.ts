import type { OperationType, OperationAccess, EntityTag } from "./types";

export interface AuraOperation {
  readonly __auraOperation: true;
  readonly name: string;
  readonly type: OperationType;
  readonly access: OperationAccess;
  readonly inputSchema: unknown;
  readonly paramsSchema: unknown;
  readonly entities: readonly EntityTag[];
  execute(args: { ctx: unknown; input: unknown; params?: unknown; req?: Request }): Promise<unknown>;
}

export type RegisteredAuraOperation = AuraOperation;
