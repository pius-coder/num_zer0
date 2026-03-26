import { ANSIColors } from "./types";

// ANSI escape codes for terminal styling
export const ANSI: ANSIColors = {
    // Reset
    reset: "\x1b[0m",

    // Text styles
    bold: "\x1b[1m",
    dim: "\x1b[2m",
    italic: "\x1b[3m",
    underline: "\x1b[4m",
    inverse: "\x1b[7m",
    hidden: "\x1b[8m",
    strikethrough: "\x1b[9m",

    // Foreground colors
    black: "\x1b[30m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    magenta: "\x1b[35m",
    cyan: "\x1b[36m",
    white: "\x1b[37m",
    gray: "\x1b[90m",

    // Bright foreground colors
    brightRed: "\x1b[91m",
    brightGreen: "\x1b[92m",
    brightYellow: "\x1b[93m",
    brightBlue: "\x1b[94m",
    brightMagenta: "\x1b[95m",
    brightCyan: "\x1b[96m",
    brightWhite: "\x1b[97m",

    // Background colors
    bgBlack: "\x1b[40m",
    bgRed: "\x1b[41m",
    bgGreen: "\x1b[42m",
    bgYellow: "\x1b[43m",
    bgBlue: "\x1b[44m",
    bgMagenta: "\x1b[45m",
    bgCyan: "\x1b[46m",
    bgWhite: "\x1b[47m",

    // Bright background colors
    bgBrightRed: "\x1b[101m",
    bgBrightGreen: "\x1b[102m",
    bgBrightYellow: "\x1b[103m",
    bgBrightBlue: "\x1b[104m",
    bgBrightMagenta: "\x1b[105m",
    bgBrightCyan: "\x1b[106m",
    bgBrightWhite: "\x1b[107m",
} as const;

// Additional ANSI codes not in the type
export const ANSI_EXTRA = {
    // Cursor movement
    cursorUp: "\x1b[A",
    cursorDown: "\x1b[B",
    cursorForward: "\x1b[C",
    cursorBack: "\x1b[D",
    cursorNextLine: "\x1b[E",
    cursorPrevLine: "\x1b[F",
    cursorHome: "\x1b[H",

    // Clear screen
    clearScreen: "\x1b[2J",
    clearLine: "\x1b[2K",
    clearLineRight: "\x1b[0K",
    clearLineLeft: "\x1b[1K",

    // Save/restore cursor
    saveCursor: "\x1b[s",
    restoreCursor: "\x1b[u",

    // Show/hide cursor
    hideCursor: "\x1b[?25l",
    showCursor: "\x1b[?25h",
} as const;

/**
 * Apply ANSI styles to text
 * @param text - The text to style
 * @param styles - One or more ANSI style codes
 * @returns The styled text with reset at the end
 */
export function paint(text: string, ...styles: string[]): string {
    if (!styles.length) return text;
    const start = styles.join("");
    return `${start}${text}${ANSI.reset}`;
}

/**
 * Remove all ANSI escape codes from a string
 * @param text - Text containing ANSI codes
 * @returns Plain text without ANSI codes
 */
export function stripAnsi(text: string): string {
    // eslint-disable-next-line no-control-regex
    return text.replace(/\x1b\[[0-9;]*m/g, "");
}

/**
 * Get the visible length of text (excluding ANSI codes)
 * @param text - Text that may contain ANSI codes
 * @returns The visible character count
 */
export function getVisibleLength(text: string): number {
    return stripAnsi(text).length;
}

/**
 * Pad text to a specific visible width, accounting for ANSI codes
 * @param text - Text that may contain ANSI codes
 * @param width - Target visible width
 * @param char - Character to pad with (default: space)
 * @param align - Alignment: 'left' | 'right' | 'center'
 * @returns Padded text
 */
export function padAnsi(
    text: string,
    width: number,
    char: string = " ",
    align: "left" | "right" | "center" = "left",
): string {
    const visibleLen = getVisibleLength(text);
    const diff = width - visibleLen;

    if (diff <= 0) return text;

    const padding = char.repeat(diff);

    switch (align) {
        case "right":
            return padding + text;
        case "center":
            const leftPad = char.repeat(Math.floor(diff / 2));
            const rightPad = char.repeat(Math.ceil(diff / 2));
            return leftPad + text + rightPad;
        case "left":
        default:
            return text + padding;
    }
}

/**
 * Create a paint function that respects color mode
 * @param enabled - Whether colors are enabled
 * @returns A paint function that applies or skips ANSI codes
 */
export function createPainter(
    enabled: boolean,
): (text: string, ...styles: string[]) => string {
    if (enabled) {
        return paint;
    }
    // Return a function that strips existing codes and adds none
    return (text: string) => stripAnsi(text);
}

/**
 * Create a colored badge for log levels
 * @param level - Log level
 * @param colorize - Whether to apply colors
 * @returns Formatted badge string
 */
export function createBadge(level: string, colorize: boolean): string {
    const badges: Record<string, string> = {
        trace: " TRACE ",
        debug: " DEBUG ",
        info: " INFO  ",
        warn: " WARN  ",
        error: " ERROR ",
        fatal: " FATAL ",
    };

    const colors: Record<string, string> = {
        trace: ANSI.dim,
        debug: ANSI.cyan,
        info: ANSI.green,
        warn: ANSI.yellow,
        error: ANSI.red,
        fatal: ANSI.bgRed + ANSI.white,
    };

    const badge = badges[level] || ` ${level.toUpperCase()} `;

    if (!colorize) {
        return `[${badge.trim()}]`;
    }

    const color = colors[level] || ANSI.white;

    // For fatal, use inverted colors (white on red)
    if (level === "fatal") {
        return paint(badge, color);
    }

    return paint(`[${badge.trim()}]`, color);
}

/**
 * Create a dimmed timestamp
 * @param timestamp - ISO timestamp string
 * @param colorize - Whether to apply colors
 * @returns Formatted timestamp
 */
export function formatTimestamp(timestamp: string, colorize: boolean): string {
    // Extract time portion only (HH:MM:SS.mmm)
    const match = timestamp.match(/T(\d{2}:\d{2}:\d{2}\.\d{3})/);
    const time = match ? match[1] : timestamp;

    if (!colorize) {
        return time;
    }

    return paint(time, ANSI.dim);
}

/**
 * Colorize a prefix/logger name
 * @param prefix - The prefix string
 * @param colorize - Whether to apply colors
 * @returns Formatted prefix
 */
export function formatPrefix(prefix: string, colorize: boolean): string {
    if (!colorize) {
        return `[${prefix}]`;
    }

    return paint(`[${prefix}]`, ANSI.cyan);
}

/**
 * Create a separator line
 * @param char - Character to use for the line
 * @param length - Length of the line
 * @param colorize - Whether to dim the line
 * @returns Separator string
 */
export function separator(
    char: string = "─",
    length: number = 60,
    colorize: boolean = true,
): string {
    const line = char.repeat(length);
    return colorize ? paint(line, ANSI.dim) : line;
}
