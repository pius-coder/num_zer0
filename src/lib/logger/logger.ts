import {
    LogLevel,
    LogEntry,
    LoggerConfig,
    LoggerContext,
    TimerEntry,
    TableOptions,
    LOG_LEVEL_PRIORITY,
    DEFAULT_CONFIG,
    ConsoleMethod,
} from "./types";
import {
    getEnvironment,
    getRuntimeMode,
    shouldColorize,
    formatTimestamp,
    getTimestamp,
    formatDuration,
    isError,
} from "./utils";
import {
    formatForServer,
    formatForClient,
    formatForProduction,
    formatTable,
} from "./formatter";
import { serialize, getDefaultOptions } from "./serializer";

/**
 * Comprehensive Logger class for Next.js applications
 *
 * Supports server (Node.js), client (browser), and edge runtime environments.
 * Provides rich CLI output in development and structured JSON in production.
 *
 * @example
 * ```ts
 * const logger = new Logger({ prefix: 'api' });
 * logger.info('Request received', { method: 'GET', path: '/users' });
 * logger.error('Failed to fetch', new Error('Network error'));
 * ```
 */
export class Logger {
    private config: LoggerConfig;
    private context: LoggerContext;
    private timers: Map<string, TimerEntry>;
    private groupDepth: number;

    constructor(options: Partial<LoggerConfig> = {}) {
        const env = getEnvironment();
        const mode = getRuntimeMode();
        const isProduction = mode === "production";

        this.config = {
            ...DEFAULT_CONFIG,
            colorize: shouldColorize(),
            production: isProduction,
            environment: env,
            minLevel: isProduction ? "info" : "debug",
            ...options,
        };

        this.context = {};
        this.timers = new Map();
        this.groupDepth = 0;
    }

    // ─── Log Level Methods ───────────────────────────────────────────────

    /**
     * Log at TRACE level - most verbose, for detailed debugging
     */
    trace(message: string, ...data: unknown[]): void {
        this.log("trace", message, ...data);
    }

    /**
     * Log at DEBUG level - debugging information
     */
    debug(message: string, ...data: unknown[]): void {
        this.log("debug", message, ...data);
    }

    /**
     * Log at INFO level - general information
     */
    info(message: string, ...data: unknown[]): void {
        this.log("info", message, ...data);
    }

    /**
     * Log at WARN level - warning conditions
     */
    warn(message: string, ...data: unknown[]): void {
        this.log("warn", message, ...data);
    }

    /**
     * Log at ERROR level - error conditions
     */
    error(message: string, ...data: unknown[]): void {
        this.log("error", message, ...data);
    }

    /**
     * Log at FATAL level - system is unusable
     */
    fatal(message: string, ...data: unknown[]): void {
        this.log("fatal", message, ...data);
    }

    // ─── Core Log Method ─────────────────────────────────────────────────

    /**
     * Generic log method - routes to appropriate formatter based on environment
     */
    log(level: LogLevel, message: string, ...data: unknown[]): void {
        if (!this.shouldLog(level)) return;

        const entry: LogEntry = {
            level,
            message,
            timestamp: formatTimestamp(),
            data: data.length > 0 ? data : undefined,
            context:
                Object.keys(this.context).length > 0
                    ? { ...this.context }
                    : undefined,
            prefix: this.config.prefix,
        };

        this.output(entry);
    }

    // ─── Utility Methods ─────────────────────────────────────────────────

    /**
     * Display data in a table format
     * On server: ASCII table with borders
     * On client: Uses console.table()
     */
    table(data: unknown[], options?: TableOptions): void {
        if (!this.shouldLog("info")) return;

        const env = this.config.environment || getEnvironment();

        if (env === "client") {
            // Browser: use native console.table
            if (options?.columns) {
                console.table(data, options.columns);
            } else {
                console.table(data);
            }
            return;
        }

        // Server: formatted ASCII table
        const tableStr = formatTable(data, options, this.config.colorize);
        console.log(tableStr);
    }

    /**
     * Display data as a tree structure
     */
    tree(data: unknown): void {
        if (!this.shouldLog("debug")) return;

        const opts = getDefaultOptions({
            colorize: this.config.colorize,
            maxDepth: this.config.maxDepth,
            maxArrayLength: this.config.maxArrayLength,
            maxStringLength: this.config.maxStringLength,
        });

        const serialized = serialize(data, opts);
        console.log(serialized);
    }

    /**
     * Inspect an object with detailed output
     * Similar to console.dir but with enhanced formatting
     */
    dir(obj: unknown, options?: { depth?: number; colors?: boolean }): void {
        if (!this.shouldLog("debug")) return;

        const env = this.config.environment || getEnvironment();

        if (env === "client") {
            console.dir(obj, options);
            return;
        }

        const opts = getDefaultOptions({
            colorize: options?.colors ?? this.config.colorize,
            maxDepth: options?.depth ?? this.config.maxDepth,
            maxArrayLength: this.config.maxArrayLength,
            maxStringLength: this.config.maxStringLength,
        });

        const serialized = serialize(obj, opts);
        console.log(serialized);
    }

    /**
     * Start a collapsible group
     * On server: indented output with prefix
     * On client: uses console.group()
     */
    group(label?: string): void {
        const env = this.config.environment || getEnvironment();

        if (env === "client") {
            if (label) {
                console.group(label);
            } else {
                console.group();
            }
        } else {
            if (label) {
                const indent = "  ".repeat(this.groupDepth);
                const prefix = this.config.colorize
                    ? `\x1b[1m${indent}▼ ${label}\x1b[0m`
                    : `${indent}▼ ${label}`;
                console.log(prefix);
            }
        }

        this.groupDepth++;
    }

    /**
     * End a collapsible group
     */
    groupEnd(): void {
        if (this.groupDepth > 0) {
            this.groupDepth--;
        }

        const env = this.config.environment || getEnvironment();
        if (env === "client") {
            console.groupEnd();
        }
    }

    /**
     * Add context data to the next log call, then clear it
     * Returns the logger for chaining
     *
     * @example
     * ```ts
     * logger.with({ requestId: '123', userId: 'abc' }).info('Processing request');
     * ```
     */
    with(context: LoggerContext): Logger {
        const child = this.child();
        child.context = { ...this.context, ...context };
        return child;
    }

    /**
     * Start a performance timer
     *
     * @example
     * ```ts
     * logger.timer('db-query');
     * // ... perform operation
     * logger.timerEnd('db-query'); // Logs: "db-query completed in 42.3ms"
     * ```
     */
    timer(label: string): void {
        this.timers.set(label, {
            startTime: getTimestamp(),
            label,
        });
    }

    /**
     * End a performance timer and log the duration
     * @returns Duration in milliseconds, or undefined if timer not found
     */
    timerEnd(label: string): number | undefined {
        const timer = this.timers.get(label);
        if (!timer) {
            this.warn(`Timer "${label}" does not exist`);
            return undefined;
        }

        const duration = getTimestamp() - timer.startTime;
        this.timers.delete(label);

        const entry: LogEntry = {
            level: "info",
            message: `${label} completed`,
            timestamp: formatTimestamp(),
            duration,
            context:
                Object.keys(this.context).length > 0
                    ? { ...this.context }
                    : undefined,
            prefix: this.config.prefix,
        };

        this.output(entry);
        return duration;
    }

    // ─── Context Methods ─────────────────────────────────────────────────

    /**
     * Create a child logger with inherited configuration and context
     * Child loggers share the parent's config but have their own context
     *
     * @example
     * ```ts
     * const requestLogger = logger.child({ requestId: '123' });
     * requestLogger.info('Handling request'); // Includes requestId in context
     * ```
     */
    child(contextOrOptions?: LoggerContext | Partial<LoggerConfig>): Logger {
        // Determine if the argument is context or config
        let childConfig = { ...this.config };
        let childContext = { ...this.context };

        if (contextOrOptions) {
            // Check if it looks like a config (has known config keys)
            const configKeys: (keyof LoggerConfig)[] = [
                "minLevel",
                "prefix",
                "colorize",
                "timestamp",
                "production",
                "environment",
                "stackTrace",
                "maxDepth",
                "maxArrayLength",
                "maxStringLength",
            ];

            const hasConfigKey = Object.keys(contextOrOptions).some((key) =>
                configKeys.includes(key as keyof LoggerConfig),
            );

            if (hasConfigKey) {
                childConfig = {
                    ...childConfig,
                    ...(contextOrOptions as Partial<LoggerConfig>),
                };
            } else {
                childContext = {
                    ...childContext,
                    ...(contextOrOptions as LoggerContext),
                };
            }
        }

        const child = new Logger(childConfig);
        child.context = childContext;
        return child;
    }

    /**
     * Set a persistent context value
     * This value will be included in all subsequent log entries
     */
    setContext(key: string, value: unknown): void {
        this.context[key] = value;
    }

    /**
     * Clear all persistent context
     */
    clearContext(): void {
        this.context = {};
    }

    /**
     * Get current context (read-only copy)
     */
    getContext(): Readonly<LoggerContext> {
        return { ...this.context };
    }

    // ─── Configuration Methods ───────────────────────────────────────────

    /**
     * Change the minimum log level
     */
    setLevel(level: LogLevel): void {
        this.config.minLevel = level;
    }

    /**
     * Get the current minimum log level
     */
    getLevel(): LogLevel {
        return this.config.minLevel;
    }

    /**
     * Change the logger prefix
     */
    setPrefix(prefix: string): void {
        this.config.prefix = prefix;
    }

    /**
     * Get the current configuration (read-only copy)
     */
    getConfig(): Readonly<LoggerConfig> {
        return { ...this.config };
    }

    // ─── Private Methods ─────────────────────────────────────────────────

    /**
     * Check if a message at the given level should be logged
     */
    private shouldLog(level: LogLevel): boolean {
        return (
            LOG_LEVEL_PRIORITY[level] >=
            LOG_LEVEL_PRIORITY[this.config.minLevel]
        );
    }

    /**
     * Output a log entry to the appropriate destination
     */
    private output(entry: LogEntry): void {
        const env = this.config.environment || getEnvironment();

        // Production mode: structured JSON
        if (this.config.production) {
            const json = formatForProduction(entry, this.config);
            const method = this.getConsoleMethod(entry.level);
            console[method](json);
            return;
        }

        // Client/browser: styled console output
        if (env === "client") {
            this.outputClient(entry);
            return;
        }

        // Server/edge: rich CLI output
        this.outputServer(entry);
    }

    /**
     * Output to server console with ANSI formatting
     */
    private outputServer(entry: LogEntry): void {
        const formatted = formatForServer(entry, this.config);
        const method = this.getConsoleMethod(entry.level);

        // Add group indentation
        if (this.groupDepth > 0) {
            const indent = "  ".repeat(this.groupDepth);
            const indented = formatted
                .split("\n")
                .map((line) => indent + line)
                .join("\n");
            console[method](indented);
        } else {
            console[method](formatted);
        }
    }

    /**
     * Output to browser console with CSS styling
     */
    private outputClient(entry: LogEntry): void {
        const { format, args } = formatForClient(entry, this.config);
        const method = this.getConsoleMethod(entry.level);

        console[method](format, ...args);
    }

    /**
     * Map log level to console method
     */
    private getConsoleMethod(level: LogLevel): ConsoleMethod {
        switch (level) {
            case "trace":
                return "debug";
            case "debug":
                return "debug";
            case "info":
                return "log";
            case "warn":
                return "warn";
            case "error":
                return "error";
            case "fatal":
                return "error";
            default:
                return "log";
        }
    }
}

// ─── Factory Function ────────────────────────────────────────────────────────

/**
 * Create a new Logger instance
 * Convenience factory function for creating loggers
 *
 * @example
 * ```ts
 * const logger = createLogger({ prefix: 'api', minLevel: 'info' });
 * logger.info('Server started');
 * ```
 */
export function createLogger(
    options?: Partial<LoggerConfig>,
): Logger {
    return new Logger(options);
}

