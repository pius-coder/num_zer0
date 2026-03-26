import {
    LogEntry,
    LoggerConfig,
    JSONLogEntry,
    BROWSER_STYLES,
    BrowserStyle,
    LogLevel,
    TableOptions,
    TREE_CHARS,
} from "./types";
import { ANSI, paint, createBadge, formatTimestamp as formatAnsiTimestamp, formatPrefix, stripAnsi, getVisibleLength, padAnsi } from "./ansi";
import { serialize, serializeInline, serializeForJSON, getDefaultOptions } from "./serializer";
import { getEnvironment, getShortTime, isError, formatDuration } from "./utils";

/**
 * Format output for server CLI with rich ANSI colors
 * Produces colorized, tree-structured output for development
 */
export function formatForServer(entry: LogEntry, config: LoggerConfig): string {
    const c = config.colorize;
    const parts: string[] = [];

    // Badge: [INFO], [ERROR], etc.
    const badge = createBadge(entry.level, c);
    parts.push(badge);

    // Timestamp (dimmed)
    if (config.timestamp && entry.timestamp) {
        const ts = formatAnsiTimestamp(entry.timestamp, c);
        parts.push(ts);
    }

    // Prefix/logger name
    if (entry.prefix || config.prefix) {
        const prefix = formatPrefix(entry.prefix || config.prefix, c);
        parts.push(prefix);
    }

    // Duration (if present, e.g., from timer)
    if (entry.duration !== undefined) {
        const dur = formatDuration(entry.duration);
        const durStr = c ? paint(`(${dur})`, ANSI.yellow) : `(${dur})`;
        parts.push(durStr);
    }

    // Message
    const msgColor = getMessageColor(entry.level);
    const message = c ? paint(entry.message, msgColor) : entry.message;
    parts.push(message);

    // Build the header line
    let output = parts.join(" ");

    // Context (if present)
    if (entry.context && Object.keys(entry.context).length > 0) {
        const contextStr = formatContext(entry.context, c);
        output += " " + contextStr;
    }

    // Data (serialized as tree)
    if (entry.data && entry.data.length > 0) {
        const dataLines = formatData(entry.data, config);
        if (dataLines) {
            output += "\n" + dataLines;
        }
    }

    return output;
}

/**
 * Format output for browser console with CSS styling
 * Returns an array: [format string, ...css styles, ...data]
 */
export function formatForClient(
    entry: LogEntry,
    config: LoggerConfig,
): { format: string; args: unknown[] } {
    const styles = BROWSER_STYLES[entry.level];
    const args: unknown[] = [];
    const formatParts: string[] = [];

    // Badge with CSS
    const badgeCSS = browserStyleToCSS({
        ...styles,
        padding: "2px 6px",
        borderRadius: "3px",
    });
    formatParts.push(`%c ${entry.level.toUpperCase()} `);
    args.push(badgeCSS);

    // Timestamp
    if (config.timestamp && entry.timestamp) {
        const time = getShortTime(entry.timestamp);
        formatParts.push(`%c${time}`);
        args.push("color: #6B7280; font-size: 0.85em;");
    }

    // Prefix
    if (entry.prefix || config.prefix) {
        const prefix = entry.prefix || config.prefix;
        formatParts.push(`%c[${prefix}]`);
        args.push("color: #0891B2; font-weight: bold;");
    }

    // Duration
    if (entry.duration !== undefined) {
        const dur = formatDuration(entry.duration);
        formatParts.push(`%c(${dur})`);
        args.push("color: #D97706;");
    }

    // Message
    formatParts.push(`%c${entry.message}`);
    args.push(getMessageBrowserCSS(entry.level));

    const format = formatParts.join(" ");

    // Add data as separate arguments (browser will format them natively)
    if (entry.data && entry.data.length > 0) {
        for (const item of entry.data) {
            args.push(item);
        }
    }

    // Add context as separate argument
    if (entry.context && Object.keys(entry.context).length > 0) {
        args.push(entry.context);
    }

    return { format, args };
}

/**
 * Format output for production as structured JSON
 * Single-line JSON for log aggregation services
 */
export function formatForProduction(
    entry: LogEntry,
    config: LoggerConfig,
): string {
    const jsonEntry: JSONLogEntry = {
        timestamp: entry.timestamp,
        level: entry.level,
        message: entry.message,
        prefix: entry.prefix || config.prefix,
        environment: config.environment || getEnvironment(),
    };

    // Add context if present
    if (entry.context && Object.keys(entry.context).length > 0) {
        jsonEntry.context = entry.context;
    }

    // Add duration if present
    if (entry.duration !== undefined) {
        jsonEntry.duration = entry.duration;
    }

    // Process data - extract errors and serialize
    if (entry.data && entry.data.length > 0) {
        const processedData: unknown[] = [];

        for (const item of entry.data) {
            if (isError(item)) {
                // Extract error info for structured logging
                jsonEntry.error = {
                    name: item.name,
                    message: item.message,
                    stack: item.stack,
                };

                // Check for AppError properties (duck typing)
                const appErr = item as unknown as Record<string, unknown>;
                if (typeof appErr.code === "string") {
                    jsonEntry.error.code = appErr.code;
                }
                if (typeof appErr.statusCode === "number") {
                    jsonEntry.error.statusCode = appErr.statusCode;
                }
                if (
                    appErr.details &&
                    typeof appErr.details === "object"
                ) {
                    jsonEntry.error.details = appErr.details as Record<
                        string,
                        string[]
                    >;
                }
            } else {
                processedData.push(serializeForJSON(item));
            }
        }

        if (processedData.length > 0) {
            jsonEntry.data = processedData;
        }
    }

    try {
        return JSON.stringify(jsonEntry);
    } catch {
        // Fallback if JSON.stringify fails
        return JSON.stringify({
            timestamp: jsonEntry.timestamp,
            level: jsonEntry.level,
            message: jsonEntry.message,
            prefix: jsonEntry.prefix,
            error: "Failed to serialize log data",
        });
    }
}

/**
 * Format a table from array of objects or 2D array
 * Returns a formatted ASCII table string
 */
export function formatTable(
    data: unknown[],
    options: TableOptions = {},
    colorize: boolean = true,
): string {
    if (!Array.isArray(data) || data.length === 0) {
        return colorize ? paint("(empty table)", ANSI.dim) : "(empty table)";
    }

    const maxColWidth = options.maxColumnWidth || 40;
    const showHeaders = options.showHeaders !== false;

    // Determine columns
    let columns: string[];
    if (options.columns) {
        columns = options.columns;
    } else {
        // Auto-detect from first object
        const first = data[0];
        if (typeof first === "object" && first !== null && !Array.isArray(first)) {
            columns = Object.keys(first);
        } else if (Array.isArray(first)) {
            columns = first.map((_, i) => String(i));
        } else {
            columns = ["value"];
        }
    }

    // Build rows
    const rows: string[][] = data.map((item) => {
        if (typeof item === "object" && item !== null && !Array.isArray(item)) {
            return columns.map((col) => {
                const val = (item as Record<string, unknown>)[col];
                return formatCellValue(val, maxColWidth);
            });
        } else if (Array.isArray(item)) {
            return columns.map((_, i) => formatCellValue(item[i], maxColWidth));
        } else {
            return [formatCellValue(item, maxColWidth)];
        }
    });

    // Calculate column widths
    const colWidths = columns.map((col, i) => {
        const headerWidth = col.length;
        const maxDataWidth = rows.reduce(
            (max, row) => Math.max(max, (row[i] || "").length),
            0,
        );
        return Math.min(Math.max(headerWidth, maxDataWidth) + 2, maxColWidth + 2);
    });

    const lines: string[] = [];
    const c = colorize;

    // Top border
    const topBorder =
        TREE_CHARS.topLeft +
        colWidths.map((w) => TREE_CHARS.horizontal.repeat(w)).join(TREE_CHARS.horizontalDown) +
        TREE_CHARS.topRight;
    lines.push(c ? paint(topBorder, ANSI.dim) : topBorder);

    // Header row
    if (showHeaders) {
        const headerRow =
            TREE_CHARS.vertical +
            columns
                .map((col, i) => {
                    const padded = ` ${col}`.padEnd(colWidths[i]!);
                    return c ? paint(padded, ANSI.cyan, ANSI.bold) : padded;
                })
                .join(c ? paint(TREE_CHARS.vertical, ANSI.dim) : TREE_CHARS.vertical) +
            (c ? paint(TREE_CHARS.vertical, ANSI.dim) : TREE_CHARS.vertical);
        lines.push(headerRow);

        // Header separator
        const headerSep =
            TREE_CHARS.verticalRight +
            colWidths.map((w) => TREE_CHARS.horizontal.repeat(w)).join(TREE_CHARS.cross) +
            TREE_CHARS.verticalLeft;
        lines.push(c ? paint(headerSep, ANSI.dim) : headerSep);
    }

    // Data rows
    rows.forEach((row) => {
        const dataRow =
            TREE_CHARS.vertical +
            row
                .map((cell, i) => {
                    const padded = ` ${cell}`.padEnd(colWidths[i]!);
                    return c ? padded : padded;
                })
                .join(c ? paint(TREE_CHARS.vertical, ANSI.dim) : TREE_CHARS.vertical) +
            (c ? paint(TREE_CHARS.vertical, ANSI.dim) : TREE_CHARS.vertical);
        lines.push(dataRow);
    });

    // Bottom border
    const bottomBorder =
        TREE_CHARS.bottomLeft +
        colWidths.map((w) => TREE_CHARS.horizontal.repeat(w)).join(TREE_CHARS.horizontalUp) +
        TREE_CHARS.bottomRight;
    lines.push(c ? paint(bottomBorder, ANSI.dim) : bottomBorder);

    return lines.join("\n");
}

// ─── Internal Helpers ────────────────────────────────────────────────────────

/**
 * Get ANSI color for message based on log level
 */
function getMessageColor(level: LogLevel): string {
    switch (level) {
        case "trace":
            return ANSI.dim;
        case "debug":
            return ANSI.white;
        case "info":
            return ANSI.white;
        case "warn":
            return ANSI.yellow;
        case "error":
            return ANSI.red;
        case "fatal":
            return ANSI.red + ANSI.bold;
        default:
            return ANSI.white;
    }
}

/**
 * Get browser CSS for message based on log level
 */
function getMessageBrowserCSS(level: LogLevel): string {
    switch (level) {
        case "trace":
            return "color: #9CA3AF;";
        case "debug":
            return "color: inherit;";
        case "info":
            return "color: inherit;";
        case "warn":
            return "color: #92400E; font-weight: bold;";
        case "error":
            return "color: #DC2626; font-weight: bold;";
        case "fatal":
            return "color: #FFFFFF; background: #DC2626; font-weight: bold; padding: 2px 4px;";
        default:
            return "color: inherit;";
    }
}

/**
 * Convert BrowserStyle to CSS string
 */
function browserStyleToCSS(style: BrowserStyle): string {
    const parts: string[] = [];
    if (style.color) parts.push(`color: ${style.color}`);
    if (style.background) parts.push(`background: ${style.background}`);
    if (style.fontWeight) parts.push(`font-weight: ${style.fontWeight}`);
    if (style.fontStyle) parts.push(`font-style: ${style.fontStyle}`);
    if (style.padding) parts.push(`padding: ${style.padding}`);
    if (style.borderRadius) parts.push(`border-radius: ${style.borderRadius}`);
    return parts.join("; ");
}

/**
 * Format context object as inline key=value pairs
 */
function formatContext(
    context: Record<string, unknown>,
    colorize: boolean,
): string {
    const pairs = Object.entries(context).map(([key, value]) => {
        const keyStr = colorize ? paint(key, ANSI.dim) : key;
        const valStr = colorize
            ? paint(String(value), ANSI.cyan)
            : String(value);
        return `${keyStr}=${valStr}`;
    });

    const str = pairs.join(" ");
    return colorize ? paint(`{${str}}`, ANSI.dim) : `{${str}}`;
}

/**
 * Format data items for server output
 */
function formatData(data: unknown[], config: LoggerConfig): string {
    const lines: string[] = [];

    for (const item of data) {
        const opts = getDefaultOptions({
            colorize: config.colorize,
            maxDepth: config.maxDepth,
            maxArrayLength: config.maxArrayLength,
            maxStringLength: config.maxStringLength,
            indent: 1,
        });

        const serialized = serialize(item, opts);
        if (serialized) {
            lines.push(serialized);
        }
    }

    return lines.join("\n");
}

/**
 * Format a cell value for table display
 */
function formatCellValue(value: unknown, maxWidth: number): string {
    if (value === null) return "null";
    if (value === undefined) return "";
    if (typeof value === "string") {
        return value.length > maxWidth
            ? value.slice(0, maxWidth - 3) + "..."
            : value;
    }
    if (typeof value === "number" || typeof value === "boolean") {
        return String(value);
    }
    if (value instanceof Date) {
        return value.toISOString();
    }
    const str = String(value);
    return str.length > maxWidth ? str.slice(0, maxWidth - 3) + "..." : str;
}
