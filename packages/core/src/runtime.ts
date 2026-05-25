import type { AuraPlugin, AuraPluginSetup } from "./plugin";
import type { AuraContext, ContextExtension } from "./context";
import type { RegisteredAuraOperation } from "./operation";
import type { AuraConfig } from "./types";
import { InMemoryRegistry } from "./registry";
import type { Registry } from "./registry";
import type { AuraManifestExtension, AuraClientManifest } from "./manifest";

interface RouteEntry {
  method: string;
  path: string;
  handler: unknown;
}

interface MigrationEntry {
  name: string;
  up: string;
  down?: string;
}

interface GeneratorEntry {
  name: string;
  handler: (args: unknown) => void | Promise<void>;
}

interface PermissionEntry {
  name: string;
  description?: string;
}

interface EventHandler {
  eventName: string;
  handler: (data: unknown) => void | Promise<void>;
}

export interface AuraRuntime {
  registerPlugin(plugin: AuraPlugin): void;
  getPlugin(name: string): AuraPlugin | undefined;
  operations: {
    register(op: RegisteredAuraOperation): void;
    get(name: string): RegisteredAuraOperation | null;
    list(): RegisteredAuraOperation[];
  };
  createContext(args: { request?: Request; source: string; requestId: string }): Promise<AuraContext>;
  config: AuraConfig;
  start(): Promise<void>;
  stop(): Promise<void>;
  getClientManifest(): AuraClientManifest;
  getPluginRoutes(): Array<{ method: string; path: string; handler: unknown }>;
  getPluginMigrations(): Array<{ name: string; up: string; down?: string }>;
}

export class AuraRuntimeImpl implements AuraRuntime {
  private plugins = new Map<string, AuraPlugin>();
  private registry: Registry;

  private routes: RouteEntry[] = [];
  private contextExtensions = new Map<string, ContextExtension<unknown>>();
  private manifestExtensions: AuraManifestExtension[] = [];
  private migrations: MigrationEntry[] = [];
  private generators: GeneratorEntry[] = [];
  private permissionDefs: PermissionEntry[] = [];
  private eventHandlers: EventHandler[] = [];

  public config: AuraConfig;

  constructor(config: AuraConfig, registry?: Registry) {
    this.config = config;
    this.registry = registry ?? new InMemoryRegistry();
  }

  registerPlugin(plugin: AuraPlugin): void {
    if (this.plugins.has(plugin.name)) {
      console.warn(`[aura] Plugin already registered (skipped): ${plugin.name}`);
      return;
    }
    this.plugins.set(plugin.name, plugin);
  }

  getPlugin(name: string): AuraPlugin | undefined {
    return this.plugins.get(name);
  }

  get operations() {
    return {
      register: (op: RegisteredAuraOperation) => this.registry.registerOperation(op),
      get: (name: string) => this.registry.getOperation(name),
      list: () => this.registry.listOperations(),
    };
  }

  async createContext(args: {
    request?: Request;
    source: string;
    requestId: string;
  }): Promise<AuraContext> {
    const baseCtx: AuraContext = {
      requestId: args.requestId,
      source: args.source as AuraContext["source"],
      log: console as unknown as AuraContext["log"],
      request: {
        ip: args.request?.headers.get("x-forwarded-for") ?? undefined,
        userAgent: args.request?.headers.get("user-agent") ?? undefined,
        origin: args.request?.headers.get("origin") ?? undefined,
      },
      config: this.config,
      capabilities: {},
    };

    for (const [key, ext] of this.contextExtensions) {
      baseCtx.capabilities[key] = ext(baseCtx);
    }

    return baseCtx;
  }

  async start(): Promise<void> {
    for (const plugin of this.plugins.values()) {
      const setup = this.createPluginSetup();
      await plugin.setup(setup);
    }
  }

  async stop(): Promise<void> {
    this.plugins.clear();
    this.routes = [];
    this.contextExtensions.clear();
    this.manifestExtensions = [];
    this.migrations = [];
    this.generators = [];
    this.permissionDefs = [];
    this.eventHandlers = [];
  }

  getPluginRoutes(): RouteEntry[] {
    return [...this.routes];
  }

  getPluginMigrations(): MigrationEntry[] {
    return [...this.migrations];
  }

  getPluginManifestExtensions(): AuraManifestExtension[] {
    return [...this.manifestExtensions];
  }

  getClientManifest() {
    return this.registry.getClientManifest();
  }

  private createPluginSetup(): AuraPluginSetup {
    return {
      operations: {
        register: (op) => this.registry.registerOperation(op),
        get: (name) => this.registry.getOperation(name),
        list: () => this.registry.listOperations(),
      },
      routes: {
        register: (method, path, handler) => {
          this.routes.push({ method, path, handler });
        },
        getRouter: () => null,
      },
      context: {
        extend: (key, extension) => {
          this.contextExtensions.set(key, extension as ContextExtension<unknown>);
        },
      },
      manifest: {
        extend: (data) => {
          this.manifestExtensions.push(data);
        },
      },
      migrations: {
        register: (name, up, down) => {
          this.migrations.push({ name, up, down });
        },
      },
      cli: {
        registerGenerator: (name, handler) => {
          this.generators.push({ name, handler });
        },
      },
      permissions: {
        define: (name, description) => {
          this.permissionDefs.push({ name, description });
        },
      },
      events: {
        subscribe: (eventName, handler) => {
          this.eventHandlers.push({ eventName, handler });
        },
      },
    };
  }
}
