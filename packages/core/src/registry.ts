import type { RegisteredAuraOperation } from "./operation";

export interface Registry {
  // operations
  registerOperation(op: RegisteredAuraOperation): void;
  getOperation(name: string): RegisteredAuraOperation | null;
  listOperations(): RegisteredAuraOperation[];

  // capabilities (plugins register their services here)
  registerCapability<T>(name: string, capability: T): void;
  getCapability<T>(name: string): T | undefined;
}
