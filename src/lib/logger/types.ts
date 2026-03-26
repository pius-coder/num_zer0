// Log levels in order of severity
export type LogLevel = "trace" | "debug" | "info" | "warn" | "error" | "fatal";

// Log level priority (higher = more severe)
export const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  trace: 0,
  debug: 1,
  info: 2,
  warn: 3,
  error: 4,
  fatal: 5,
} as const;

// Log level colors for server CLI
export const LOG_LEVEL_COLORS: Record<LogLevel, string> = {
  trace: "\x1b[90m",   // Gray
  debug: "\x1b[36m",   // Cyan
  info: "\x1b[32m",    // Green
  warn: "\x1b[33m",    // Yellow
  error: "\x1b[31m",   // Red
  fatal: "\x1b[35m",   // Magenta
} as const;

// Log level icons for visual identification
export const LOG_LEVEL_ICONS: Record<LogLevel, string> = {
  trace: "◌",
  debug: "○",
  info: "●",
  warn: "▲",
  error: "✕",
  fatal: "✖",
} as const;

// Log level badges for CLI output
export const LOG_LEVEL_BADGES: Record<LogLevel, string> = {
  trace: "TRACE",
  debug: "DEBUG",
  info: "INFO",
  warn: "WARN",
  error: "ERROR",
  fatal: "FATAL",
} as const;

// Environment types
export type Environment = "server" | "client" | "edge";

// Runtime mode
export type RuntimeMode = "development" | "production" | "test";

// Log entry structure
export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  data?: unknown[];
  context?: Record<string, unknown>;
  prefix?: string;
  duration?: number;
}

// Logger configuration
export interface LoggerConfig {
  /** Minimum log level to output */
  minLevel: LogLevel;
  /** Prefix for all log messages */
  prefix: string;
  /** Whether to colorize output (server only) */
  colorize: boolean;
  /** Whether to show timestamps */
  timestamp: boolean;
  /** Production mode - outputs JSON instead of formatted text */
  production: boolean;
  /** Environment override (auto-detected if not provided) */
  environment?: Environment;
  /** Include stack traces for errors */
  stackTrace: boolean;
  /** Maximum depth for object serialization */
  maxDepth: number;
  /** Maximum array length to display */
  maxArrayLength: number;
  /** Maximum string length before truncation */
  maxStringLength: number;
}

// Default logger configuration
export const DEFAULT_CONFIG: LoggerConfig = {
  minLevel: "debug",
  prefix: "_n0",
  colorize: true,
  timestamp: true,
  production: false,
  stackTrace: true,
  maxDepth: 5,
  maxArrayLength: 100,
  maxStringLength: 200,
} as const;

// Serializer options for formatting complex objects
export interface SerializerOptions {
  /** Current depth in the object tree */
  depth: number;
  /** Maximum depth to serialize */
  maxDepth: number;
  /** Maximum array length */
  maxArrayLength: number;
  /** Maximum string length */
  maxStringLength: number;
  /** Whether to colorize output */
  colorize: boolean;
  /** Indentation for tree output */
  indent: number;
  /** Whether this is the top-level object */
  isRoot: boolean;
  /** Prefix for tree lines */
  prefix: string;
  /** ANSI color codes */
  colors: typeof ANSI_COLORS;
}

// ANSI color codes type
export interface ANSIColors {
  reset: string;
  bold: string;
  dim: string;
  italic: string;
  underline: string;
  inverse: string;
  hidden: string;
  strikethrough: string;
  black: string;
  red: string;
  green: string;
  yellow: string;
  blue: string;
  magenta: string;
  cyan: string;
  white: string;
  gray: string;
  brightRed: string;
  brightGreen: string;
  brightYellow: string;
  brightBlue: string;
  brightMagenta: string;
  brightCyan: string;
  brightWhite: string;
  bgBlack: string;
  bgRed: string;
  bgGreen: string;
  bgYellow: string;
  bgBlue: string;
  bgMagenta: string;
  bgCyan: string;
  bgWhite: string;
  bgBrightRed: string;
  bgBrightGreen: string;
  bgBrightYellow: string;
  bgBrightBlue: string;
  bgBrightMagenta: string;
  bgBrightCyan: string;
  bgBrightWhite: string;
}

// Export the ANSI colors object (will be defined in ansi.ts)
export const ANSI_COLORS: ANSIColors = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  italic: "\x1b[3m",
  underline: "\x1b[4m",
  inverse: "\x1b[7m",
  hidden: "\x1b[8m",
  strikethrough: "\x1b[9m",
  black: "\x1b[30m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  gray: "\x1b[90m",
  brightRed: "\x1b[91m",
  brightGreen: "\x1b[92m",
  brightYellow: "\x1b[93m",
  brightBlue: "\x1b[94m",
  brightMagenta: "\x1b[95m",
  brightCyan: "\x1b[96m",
  brightWhite: "\x1b[97m",
  bgBlack: "\x1b[40m",
  bgRed: "\x1b[41m",
  bgGreen: "\x1b[42m",
  bgYellow: "\x1b[43m",
  bgBlue: "\x1b[44m",
  bgMagenta: "\x1b[45m",
  bgCyan: "\x1b[46m",
  bgWhite: "\x1b[47m",
  bgBrightRed: "\x1b[101m",
  bgBrightGreen: "\x1b[102m",
  bgBrightYellow: "\x1b[103m",
  bgBrightBlue: "\x1b[104m",
  bgBrightMagenta: "\x1b[105m",
  bgBrightCyan: "\x1b[106m",
  bgBrightWhite: "\x1b[107m",
} as const;

// Tree line characters for structured output
export const TREE_CHARS = {
  vertical: "│",
  horizontal: "─",
  corner: "└",
  tee: "├",
  cross: "┼",
  topLeft: "┌",
  topRight: "┐",
  bottomLeft: "└",
  bottomRight: "┘",
  verticalRight: "├",
  verticalLeft: "┤",
  horizontalDown: "┬",
  horizontalUp: "┴",
} as const;

// Timer entry for performance tracking
export interface TimerEntry {
  startTime: number;
  label: string;
}

// Context for child loggers
export interface LoggerContext {
  [key: string]: unknown;
}

// Table formatting options
export interface TableOptions {
  /** Columns to display (auto-detected if not provided) */
  columns?: string[];
  /** Maximum column width */
  maxColumnWidth?: number;
  /** Whether to show headers */
  showHeaders?: boolean;
}

// Result type for operations
export type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };

// Error info for structured error logging
export interface ErrorInfo {
  name: string;
  message: string;
  code?: string;
  statusCode?: number;
  stack?: string;
  details?: Record<string, string[]>;
}

// JSON log entry for production mode
export interface JSONLogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  prefix: string;
  data?: unknown[];
  context?: Record<string, unknown>;
  duration?: number;
  environment: Environment;
  error?: ErrorInfo;
}

// Console method types for type safety
export type ConsoleMethod = "log" | "info" | "warn" | "error" | "debug" | "trace";

// Browser console style
export interface BrowserStyle {
  color?: string;
  background?: string;
  fontWeight?: string;
  fontStyle?: string;
  padding?: string;
  borderRadius?: string;
}

// CSS styles for browser console
export const BROWSER_STYLES: Record<LogLevel, BrowserStyle> = {
  trace: { color: "#6B7280", fontStyle: "italic" },
  debug: { color: "#0891B2", fontWeight: "bold" },
  info: { color: "#059669", fontWeight: "bold" },
  warn: { color: "#D97706", fontWeight: "bold", background: "#FEF3C7", padding: "2px 6px", borderRadius: "3px" },
  error: { color: "#DC2626", fontWeight: "bold", background: "#FEE2E2", padding: "2px 6px", borderRadius: "3px" },
  fatal: { color: "#FFFFFF", fontWeight: "bold", background: "#DC2626", padding: "2px 8px", borderRadius: "3px" },
} as const;
