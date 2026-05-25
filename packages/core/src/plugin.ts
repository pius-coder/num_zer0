import type { z } from "zod";
import type { RegisteredAuraOperation } from "./operation";
import type { ContextExtension } from "./context";
import type { AuraManifestExtension } from "./manifest";

export interface AuraPlugin {
  name: string;
  version: string;
  requires?: { aura: string; plugins?: Record<string, string> };
  config?: z.ZodSchema;
  setup(ctx: AuraPluginSetup): void | Promise<void>;
}

export interface AuraPluginSetup {
  operations: {
    register(op: RegisteredAuraOperation): void;
    get(name: string): RegisteredAuraOperation | null;
    list(): RegisteredAuraOperation[];
  };
  routes: {
    register(method: string, path: string, handler: unknown): void;
    getRouter(): unknown;
  };
  context: {
    extend<T>(key: string, extension: ContextExtension<T>): void;
  };
  manifest: {
    extend(data: AuraManifestExtension): void;
  };
  migrations: {
    register(name: string, up: string, down?: string): void;
  };
  cli: {
    registerGenerator(name: string, handler: (args: unknown) => void | Promise<void>): void;
  };
  permissions: {
    define(name: string, description?: string): void;
  };
  events: {
    subscribe(eventName: string, handler: (data: unknown) => void | Promise<void>): void;
  };
}
