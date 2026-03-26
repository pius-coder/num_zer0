import { Environment, RuntimeMode } from "./types";

/**
 * Check if running in a server environment
 * This includes: API routes, Server Actions, Server Components, Middleware
 * @returns true if running on the server
 */
export function isServer(): boolean {
    // Check for browser environment first
    if (typeof window !== "undefined") {
        return false;
    }

    // Could be server or edge runtime
    return true;
}

/**
 * Check if running in a client/browser environment
 * @returns true if running in the browser
 */
export function isClient(): boolean {
    return typeof window !== "undefined";
}

/**
 * Check if running in Edge Runtime
 * Edge Runtime is used in Next.js middleware with runtime: 'edge'
 * It has limitations: no Node.js APIs, no process.env
 * @returns true if running in Edge Runtime
 */
export function isEdgeRuntime(): boolean {
    // Edge runtime doesn't have process.cwd() or process.version
    // It also has a global EdgeRuntime variable in some cases
    if (typeof globalThis !== "undefined") {
        // @ts-expect-error - EdgeRuntime is a global in edge runtime
        if (typeof globalThis.EdgeRuntime !== "undefined") {
            return true;
        }
    }

    // Check for absence of Node.js-specific globals
    // In Edge Runtime, process exists but is limited
    if (typeof process !== "undefined") {
        if (typeof process.cwd !== "function") {
            return true;
        }
    }

    return false;
}

/**
 * Get the current environment type
 * @returns The environment type: 'server', 'client', or 'edge'
 */
export function getEnvironment(): Environment {
    if (isClient()) {
        return "client";
    }

    if (isEdgeRuntime()) {
        return "edge";
    }

    return "server";
}

/**
 * Get the current runtime mode
 * @returns The runtime mode: 'development', 'production', or 'test'
 */
export function getRuntimeMode(): RuntimeMode {
    // In Edge Runtime, we might not have process.env
    // Default to production for safety
    if (isEdgeRuntime()) {
        // Try to get from globalThis or default to production
        // @ts-expect-error - might be set by the runtime
        const env = globalThis.__ENV__?.NODE_ENV;
        if (env === "development" || env === "test") {
            return env;
        }
        return "production";
    }

    // Server or client - process.env should be available
    if (typeof process !== "undefined" && process.env) {
        const nodeEnv = process.env.NODE_ENV;
        if (nodeEnv === "development" || nodeEnv === "test") {
            return nodeEnv;
        }
    }

    // Default to production
    return "production";
}

/**
 * Check if running in development mode
 * @returns true if NODE_ENV is 'development'
 */
export function isDevelopment(): boolean {
    return getRuntimeMode() === "development";
}

/**
 * Check if running in production mode
 * @returns true if NODE_ENV is 'production'
 */
export function isProduction(): boolean {
    return getRuntimeMode() === "production";
}

/**
 * Check if running in test mode
 * @returns true if NODE_ENV is 'test'
 */
export function isTest(): boolean {
    return getRuntimeMode() === "test";
}

/**
 * Check if colors should be enabled
 * Colors are enabled in development and when not in Edge Runtime
 * @returns true if colors should be used
 */
export function shouldColorize(): boolean {
    // No colors in Edge Runtime (limited terminal support)
    if (isEdgeRuntime()) {
        return false;
    }

    // No colors in production (logs should be structured JSON)
    if (isProduction()) {
        return false;
    }

    // Note: We intentionally avoid checking process.stdout.isTTY here
    // because this file is imported by Edge Middleware (via middleware.ts),
    // and process.stdout is not available in the Edge Runtime.
    // The Edge Runtime and production guards above are sufficient.
    return true;
}

/**
 * Format timestamp in ISO format
 * @param date - Date object or timestamp (defaults to now)
 * @returns ISO formatted timestamp string
 */
export function formatTimestamp(date: Date | number = Date.now()): string {
    const d = date instanceof Date ? date : new Date(date);
    return d.toISOString();
}

/**
 * Get a short time string for display (HH:MM:SS.mmm)
 * @param timestamp - ISO timestamp or Date
 * @returns Short time string
 */
export function getShortTime(timestamp: string | Date): string {
    const d = typeof timestamp === "string" ? new Date(timestamp) : timestamp;
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    const seconds = String(d.getSeconds()).padStart(2, "0");
    const ms = String(d.getMilliseconds()).padStart(3, "0");
    return `${hours}:${minutes}:${seconds}.${ms}`;
}

/**
 * Get current high-resolution timestamp
 * Uses performance.now() if available, otherwise Date.now()
 * @returns Timestamp in milliseconds
 */
export function getTimestamp(): number {
    if (typeof performance !== "undefined" && performance.now) {
        return performance.now();
    }
    return Date.now();
}

/**
 * Format duration in human-readable format
 * @param ms - Duration in milliseconds
 * @returns Formatted duration string
 */
export function formatDuration(ms: number): string {
    if (ms < 1) {
        return `${ms.toFixed(2)}ms`;
    }

    if (ms < 1000) {
        return `${ms.toFixed(1)}ms`;
    }

    if (ms < 60000) {
        return `${(ms / 1000).toFixed(2)}s`;
    }

    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(1);
    return `${minutes}m ${seconds}s`;
}

/**
 * Check if a value is a plain object (not an array, null, or class instance)
 * @param value - Value to check
 * @returns true if value is a plain object
 */
export function isPlainObject(value: unknown): value is Record<string, unknown> {
    if (value === null || typeof value !== "object") {
        return false;
    }

    const proto = Object.getPrototypeOf(value);

    // Object.prototype is null for objects created with Object.create(null)
    // or it's Object.prototype for plain objects
    return proto === null || proto === Object.prototype;
}

/**
 * Check if a value is a primitive (string, number, boolean, null, undefined, symbol, bigint)
 * @param value - Value to check
 * @returns true if value is a primitive
 */
export function isPrimitive(value: unknown): boolean {
    return (
        value === null ||
        value === undefined ||
        typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean" ||
        typeof value === "symbol" ||
        typeof value === "bigint"
    );
}

/**
 * Check if a value is an Error object
 * @param value - Value to check
 * @returns true if value is an Error
 */
export function isError(value: unknown): value is Error {
    return value instanceof Error;
}

/**
 * Check if a value is a Date object
 * @param value - Value to check
 * @returns true if value is a Date
 */
export function isDate(value: unknown): value is Date {
    return value instanceof Date;
}

/**
 * Check if a value is a Map
 * @param value - Value to check
 * @returns true if value is a Map
 */
export function isMap(value: unknown): value is Map<unknown, unknown> {
    return value instanceof Map;
}

/**
 * Check if a value is a Set
 * @param value - Value to check
 * @returns true if value is a Set
 */
export function isSet(value: unknown): value is Set<unknown> {
    return value instanceof Set;
}

/**
 * Check if a value is a RegExp
 * @param value - Value to check
 * @returns true if value is a RegExp
 */
export function isRegExp(value: unknown): value is RegExp {
    return value instanceof RegExp;
}

/**
 * Check if a value is a Promise
 * @param value - Value to check
 * @returns true if value is a Promise
 */
export function isPromise(value: unknown): value is Promise<unknown> {
    return value instanceof Promise || (
        value !== null &&
        typeof value === "object" &&
        typeof (value as Promise<unknown>).then === "function"
    );
}

/**
 * Check if a value is a function
 * @param value - Value to check
 * @returns true if value is a function
 */
export function isFunction(value: unknown): value is (...args: unknown[]) => unknown {
    return typeof value === "function";
}

/**
 * Truncate a string to a maximum length
 * @param str - String to truncate
 * @param maxLength - Maximum length
 * @param suffix - Suffix to add when truncated (default: '...')
 * @returns Truncated string
 */
export function truncateString(
    str: string,
    maxLength: number,
    suffix: string = "..."
): string {
    if (str.length <= maxLength) {
        return str;
    }

    const truncated = str.slice(0, maxLength - suffix.length);
    return truncated + suffix;
}

/**
 * Get object constructor name safely
 * @param value - Value to get constructor name from
 * @returns Constructor name or 'Unknown'
 */
export function getConstructorName(value: unknown): string {
    if (value === null) return "null";
    if (value === undefined) return "undefined";

    const constructor = (value as object).constructor;
    if (constructor && constructor.name) {
        return constructor.name;
    }

    // Fallback to typeof
    return typeof value;
}

/**
 * Safe stringify that handles circular references
 * @param value - Value to stringify
 * @param space - Indentation space
 * @returns JSON string
 */
export function safeStringify(value: unknown, space?: string | number): string {
    const seen = new WeakSet();

    return JSON.stringify(value, (_key, val) => {
        if (typeof val === "object" && val !== null) {
            if (seen.has(val)) {
                return "[Circular]";
            }
            seen.add(val);
        }

        // Handle special types
        if (typeof val === "bigint") {
            return `${val}n`;
        }

        if (val instanceof Map) {
            return { __type: "Map", entries: Array.from(val.entries()) };
        }

        if (val instanceof Set) {
            return { __type: "Set", values: Array.from(val.values()) };
        }

        if (val instanceof Error) {
            return {
                __type: "Error",
                name: val.name,
                message: val.message,
                stack: val.stack,
            };
        }

        return val;
    }, space);
}

/**
 * Generate a unique ID for grouping or tracking
 * @returns Unique string ID
 */
export function generateId(): string {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Sleep for a specified duration
 * @param ms - Duration in milliseconds
 * @returns Promise that resolves after the duration
 */
export function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
