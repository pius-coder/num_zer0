import type { z } from "zod";
import type { AuraConfig } from "./types";
import type { AuraPlugin } from "./plugin";

export interface AuraConfigState {
  raw: AuraConfig;
  activePlugins: Map<string, AuraPlugin>;
}

export interface AuraConfigValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validatePluginConfig(
  plugins: Map<string, AuraPlugin>,
  config: AuraConfig,
): AuraConfigValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const entry of config.plugins ?? []) {
    const plugin = plugins.get(entry.name);
    if (!plugin) {
      errors.push(`Plugin not found: ${entry.name}`);
      continue;
    }
    if (plugin.config && entry.config !== undefined) {
      const result = plugin.config.safeParse(entry.config);
      if (!result.success) {
        errors.push(`Config validation failed for "${entry.name}": ${result.error.message}`);
      }
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

export function resolveActivePlugins(
  available: Map<string, AuraPlugin>,
  config: AuraConfig,
  onError?: (msg: string) => void,
): Map<string, AuraPlugin> {
  const active = new Map<string, AuraPlugin>();
  for (const entry of config.plugins ?? []) {
    const plugin = available.get(entry.name);
    if (plugin) {
      active.set(entry.name, plugin);
    } else if (onError) {
      onError(`Plugin not found: ${entry.name}`);
    }
  }
  return active;
}
