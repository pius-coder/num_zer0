import type { AuraPlugin } from "./plugin";
import type { AuraContext } from "./context";
import type { RegisteredAuraOperation } from "./operation";
import type { AuraConfig } from "./types";

export interface AuraRuntime {
  // plugin lifecycle
  registerPlugin(plugin: AuraPlugin): void;
  getPlugin(name: string): AuraPlugin | undefined;

  // operations
  operations: {
    register(op: RegisteredAuraOperation): void;
    get(name: string): RegisteredAuraOperation | null;
    list(): RegisteredAuraOperation[];
  };

  // context factory
  createContext(args: {
    request?: Request;
    source: string;
    requestId: string;
  }): Promise<AuraContext>;

  // config
  config: AuraConfig;

  // lifecycle
  start(): Promise<void>;
  stop(): Promise<void>;
}
