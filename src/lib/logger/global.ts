/**
 * Global logger instance for the application
 * This is the central logger that should be used throughout the app
 */
import { createLogger, type Logger } from "./logger";

// Create a global logger instance with application prefix
const globalLogger = createLogger({
    prefix: "n0-app",
    minLevel: "debug",
    timestamp: true,
    colorize: true,
    stackTrace: true,
    maxDepth: 5,
    maxArrayLength: 50,
    maxStringLength: 200,
});

/**
 * Get the global logger instance
 * Use this for application-wide logging
 */
export function getLogger(): Logger {
    return globalLogger;
}

/**
 * Create a child logger with custom context
 * Use this for module-specific logging
 */
export function createModuleLogger(prefix: string): Logger {
    return globalLogger.child({ prefix });
}

// Export the logger as default for convenience
export default globalLogger;
