import type { RegisteredAuraOperation } from "./operation";
import type { AuraClientManifest } from "./manifest";

export interface Registry {
  registerOperation(op: RegisteredAuraOperation): void;
  getOperation(name: string): RegisteredAuraOperation | null;
  listOperations(): RegisteredAuraOperation[];

  registerCapability<T>(name: string, capability: T): void;
  getCapability<T>(name: string): T | undefined;
}

export class InMemoryRegistry implements Registry {
  private operations = new Map<string, RegisteredAuraOperation>();
  private capabilities = new Map<string, unknown>();

  registerOperation(operation: RegisteredAuraOperation): void {
    if (this.operations.has(operation.name)) {
      console.warn(`[aura] Operation already registered (skipped): ${operation.name}`);
      return;
    }
    this.operations.set(operation.name, operation);
  }

  getOperation(name: string): RegisteredAuraOperation | null {
    return this.operations.get(name) ?? null;
  }

  listOperations(): RegisteredAuraOperation[] {
    return [...this.operations.values()];
  }

  registerCapability<T>(name: string, capability: T): void {
    this.capabilities.set(name, capability);
  }

  getCapability<T>(name: string): T | undefined {
    return this.capabilities.get(name) as T | undefined;
  }

  getClientManifest(): AuraClientManifest {
    return {
      operations: this.listOperations()
        .filter((op) => op.access !== "internal")
        .map((op) => ({
          name: op.name,
          type: op.type,
          access: op.access,
          entities: [...op.entities],
        }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    };
  }
}
