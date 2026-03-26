import { SerializerOptions, ANSI_COLORS, TREE_CHARS } from "./types";
import { ANSI, paint } from "./ansi";
import {
    isPlainObject,
    isPrimitive,
    isError,
    isDate,
    isMap,
    isSet,
    isRegExp,
    isPromise,
    isFunction,
    truncateString,
    getConstructorName,
} from "./utils";

/**
 * Default serializer options
 */
export function getDefaultOptions(
    overrides: Partial<SerializerOptions> = {},
): SerializerOptions {
    return {
        depth: 0,
        maxDepth: 5,
        maxArrayLength: 100,
        maxStringLength: 200,
        colorize: true,
        indent: 0,
        isRoot: true,
        prefix: "",
        colors: ANSI_COLORS,
        ...overrides,
    };
}

/**
 * Check if a value has AppError shape (duck typing to avoid import dependency)
 * AppError has: code (string), statusCode (number), message (string), details? (Record<string, string[]>)
 */
function isAppError(
    value: unknown,
): value is Error & {
    code: string;
    statusCode: number;
    details?: Record<string, string[]>;
} {
    return (
        isError(value) &&
        "code" in value &&
        typeof (value as Record<string, unknown>).code === "string" &&
        "statusCode" in value &&
        typeof (value as Record<string, unknown>).statusCode === "number"
    );
}

/**
 * Serialize a value to a colorized inline string (single line)
 * Used for simple values and compact representations
 */
export function serializeInline(
    value: unknown,
    options: SerializerOptions,
): string {
    const c = options.colorize;

    if (value === null) {
        return c ? paint("null", ANSI.dim) : "null";
    }

    if (value === undefined) {
        return c ? paint("undefined", ANSI.dim) : "undefined";
    }

    if (typeof value === "string") {
        const truncated = truncateString(value, options.maxStringLength);
        const quoted = `"${truncated}"`;
        return c ? paint(quoted, ANSI.green) : quoted;
    }

    if (typeof value === "number") {
        const str = Object.is(value, -0) ? "-0" : String(value);
        return c ? paint(str, ANSI.yellow) : str;
    }

    if (typeof value === "boolean") {
        const str = String(value);
        return c ? paint(str, ANSI.yellow) : str;
    }

    if (typeof value === "bigint") {
        const str = `${value}n`;
        return c ? paint(str, ANSI.yellow) : str;
    }

    if (typeof value === "symbol") {
        const str = value.toString();
        return c ? paint(str, ANSI.magenta) : str;
    }

    if (isDate(value)) {
        const str = value.toISOString();
        return c ? paint(str, ANSI.cyan) : str;
    }

    if (isRegExp(value)) {
        const str = value.toString();
        return c ? paint(str, ANSI.red) : str;
    }

    if (isFunction(value)) {
        const name = value.name || "anonymous";
        const str = `[Function: ${name}]`;
        return c ? paint(str, ANSI.cyan) : str;
    }

    if (isPromise(value)) {
        return c ? paint("[Promise]", ANSI.cyan) : "[Promise]";
    }

    if (isMap(value)) {
        const str = `Map(${value.size})`;
        return c ? paint(str, ANSI.magenta) : str;
    }

    if (isSet(value)) {
        const str = `Set(${value.size})`;
        return c ? paint(str, ANSI.magenta) : str;
    }

    if (ArrayBuffer.isView(value)) {
        const typedArray = value as unknown as { length: number; constructor: { name: string } };
        const str = `${typedArray.constructor.name}(${typedArray.length})`;
        return c ? paint(str, ANSI.cyan) : str;
    }

    if (value instanceof ArrayBuffer) {
        const str = `ArrayBuffer(${value.byteLength})`;
        return c ? paint(str, ANSI.cyan) : str;
    }

    if (Array.isArray(value)) {
        if (value.length === 0) {
            return c ? paint("[]", ANSI.dim) : "[]";
        }
        return c
            ? paint(`Array(${value.length})`, ANSI.dim)
            : `Array(${value.length})`;
    }

    if (isPlainObject(value)) {
        const keys = Object.keys(value);
        if (keys.length === 0) {
            return c ? paint("{}", ANSI.dim) : "{}";
        }
        return c
            ? paint(`Object(${keys.length})`, ANSI.dim)
            : `Object(${keys.length})`;
    }

    // Class instances
    const name = getConstructorName(value);
    return c ? paint(`[${name}]`, ANSI.cyan) : `[${name}]`;
}

/**
 * Serialize an Error object to a tree representation
 */
function serializeError(
    error: Error,
    options: SerializerOptions,
    visited: WeakSet<object>,
): string {
    const c = options.colorize;
    const lines: string[] = [];
    const indent = "  ".repeat(options.indent);
    const tee = TREE_CHARS.tee;
    const corner = TREE_CHARS.corner;

    // Error name and message
    const errorName = c ? paint(error.name, ANSI.red, ANSI.bold) : error.name;
    const errorMsg = c ? paint(error.message, ANSI.white) : error.message;
    lines.push(`${indent}${errorName}: ${errorMsg}`);

    // AppError-specific fields
    if (isAppError(error)) {
        const codeLabel = c ? paint("code:", ANSI.dim) : "code:";
        const codeVal = c
            ? paint(error.code, ANSI.yellow)
            : error.code;
        lines.push(`${indent}  ${tee} ${codeLabel} ${codeVal}`);

        const statusLabel = c ? paint("status:", ANSI.dim) : "status:";
        const statusVal = c
            ? paint(String(error.statusCode), ANSI.yellow)
            : String(error.statusCode);
        lines.push(`${indent}  ${tee} ${statusLabel} ${statusVal}`);

        if (error.details && Object.keys(error.details).length > 0) {
            const detailsLabel = c
                ? paint("details:", ANSI.dim)
                : "details:";
            lines.push(`${indent}  ${tee} ${detailsLabel}`);

            const detailKeys = Object.keys(error.details);
            detailKeys.forEach((key, i) => {
                const isLast = i === detailKeys.length - 1;
                const connector = isLast ? corner : tee;
                const fieldLabel = c ? paint(key, ANSI.cyan) : key;
                const fieldVal = error.details![key]!.join(", ");
                const fieldValStr = c
                    ? paint(fieldVal, ANSI.white)
                    : fieldVal;
                lines.push(
                    `${indent}    ${connector} ${fieldLabel}: ${fieldValStr}`,
                );
            });
        }
    }

    // Stack trace (dimmed)
    if (error.stack) {
        const stackLines = error.stack
            .split("\n")
            .slice(1) // Skip the first line (error message)
            .map((line) => line.trim())
            .filter((line) => line.startsWith("at "))
            .slice(0, 8); // Limit stack depth

        if (stackLines.length > 0) {
            const stackLabel = c ? paint("stack:", ANSI.dim) : "stack:";
            lines.push(`${indent}  ${corner} ${stackLabel}`);

            stackLines.forEach((line, i) => {
                const isLast = i === stackLines.length - 1;
                const connector = isLast ? corner : tee;
                const stackLine = c ? paint(line, ANSI.dim) : line;
                lines.push(`${indent}      ${connector} ${stackLine}`);
            });
        }
    }

    // Check for cause
    if (error.cause && typeof error.cause === "object") {
        const causeLabel = c ? paint("cause:", ANSI.dim) : "cause:";
        lines.push(`${indent}  ${corner} ${causeLabel}`);
        if (isError(error.cause)) {
            const causeStr = serializeError(
                error.cause,
                { ...options, indent: options.indent + 2 },
                visited,
            );
            lines.push(causeStr);
        } else {
            const causeStr = serializeTree(
                error.cause,
                { ...options, indent: options.indent + 2, isRoot: false },
                visited,
            );
            lines.push(causeStr);
        }
    }

    return lines.join("\n");
}

/**
 * Serialize a value to a multi-line tree representation
 * Used for complex objects, arrays, maps, sets, etc.
 */
export function serializeTree(
    value: unknown,
    options: SerializerOptions,
    visited: WeakSet<object> = new WeakSet(),
): string {
    const c = options.colorize;
    const indent = "  ".repeat(options.indent);
    const tee = TREE_CHARS.tee;
    const corner = TREE_CHARS.corner;

    // Depth limit check
    if (options.depth > options.maxDepth) {
        const str = c ? paint("[Max Depth]", ANSI.dim) : "[Max Depth]";
        return `${indent}${str}`;
    }

    // Primitives - use inline
    if (isPrimitive(value)) {
        return `${indent}${serializeInline(value, options)}`;
    }

    // Null check for objects
    if (value === null || value === undefined) {
        return `${indent}${serializeInline(value, options)}`;
    }

    // Circular reference check
    if (typeof value === "object" && value !== null) {
        if (visited.has(value)) {
            const str = c
                ? paint("[Circular]", ANSI.red, ANSI.dim)
                : "[Circular]";
            return `${indent}${str}`;
        }
        visited.add(value);
    }

    // Error objects
    if (isError(value)) {
        return serializeError(value, options, visited);
    }

    // Date
    if (isDate(value)) {
        return `${indent}${serializeInline(value, options)}`;
    }

    // RegExp
    if (isRegExp(value)) {
        return `${indent}${serializeInline(value, options)}`;
    }

    // Function
    if (isFunction(value)) {
        return `${indent}${serializeInline(value, options)}`;
    }

    // Promise
    if (isPromise(value)) {
        return `${indent}${serializeInline(value, options)}`;
    }

    // Map
    if (isMap(value)) {
        const lines: string[] = [];
        const header = c
            ? paint(`Map(${value.size})`, ANSI.magenta)
            : `Map(${value.size})`;
        lines.push(`${indent}${header}`);

        const entries = Array.from(value.entries());
        const limited = entries.slice(0, options.maxArrayLength);

        limited.forEach(([key, val], i) => {
            const isLast =
                i === limited.length - 1 && limited.length === entries.length;
            const connector = isLast ? corner : tee;
            const keyStr = serializeInline(key, options);
            const valStr = isPrimitive(val)
                ? serializeInline(val, options)
                : serializeInline(val, options);

            if (!isPrimitive(val) && typeof val === "object" && val !== null) {
                lines.push(`${indent}  ${connector} ${keyStr} =>`);
                lines.push(
                    serializeTree(
                        val,
                        {
                            ...options,
                            depth: options.depth + 1,
                            indent: options.indent + 2,
                            isRoot: false,
                        },
                        visited,
                    ),
                );
            } else {
                lines.push(
                    `${indent}  ${connector} ${keyStr} => ${valStr}`,
                );
            }
        });

        if (limited.length < entries.length) {
            const remaining = entries.length - limited.length;
            const moreStr = c
                ? paint(`... ${remaining} more entries`, ANSI.dim)
                : `... ${remaining} more entries`;
            lines.push(`${indent}  ${corner} ${moreStr}`);
        }

        return lines.join("\n");
    }

    // Set
    if (isSet(value)) {
        const lines: string[] = [];
        const header = c
            ? paint(`Set(${value.size})`, ANSI.magenta)
            : `Set(${value.size})`;
        lines.push(`${indent}${header}`);

        const values = Array.from(value.values());
        const limited = values.slice(0, options.maxArrayLength);

        limited.forEach((val, i) => {
            const isLast =
                i === limited.length - 1 && limited.length === values.length;
            const connector = isLast ? corner : tee;

            if (!isPrimitive(val) && typeof val === "object" && val !== null) {
                lines.push(`${indent}  ${connector}`);
                lines.push(
                    serializeTree(
                        val,
                        {
                            ...options,
                            depth: options.depth + 1,
                            indent: options.indent + 2,
                            isRoot: false,
                        },
                        visited,
                    ),
                );
            } else {
                lines.push(
                    `${indent}  ${connector} ${serializeInline(val, options)}`,
                );
            }
        });

        if (limited.length < values.length) {
            const remaining = values.length - limited.length;
            const moreStr = c
                ? paint(`... ${remaining} more items`, ANSI.dim)
                : `... ${remaining} more items`;
            lines.push(`${indent}  ${corner} ${moreStr}`);
        }

        return lines.join("\n");
    }

    // TypedArray
    if (ArrayBuffer.isView(value) && !(value instanceof DataView)) {
        const typedArray = value as unknown as {
            length: number;
            constructor: { name: string };
            slice: (start: number, end: number) => unknown[];
        };
        const header = c
            ? paint(
                  `${typedArray.constructor.name}(${typedArray.length})`,
                  ANSI.cyan,
              )
            : `${typedArray.constructor.name}(${typedArray.length})`;

        if (typedArray.length <= 10) {
            const preview = Array.from(
                typedArray.slice(0, 10) as unknown as ArrayLike<number>,
            ).join(", ");
            return `${indent}${header} [${preview}]`;
        }

        const preview = Array.from(
            typedArray.slice(0, 10) as unknown as ArrayLike<number>,
        ).join(", ");
        const moreStr = c
            ? paint(`... ${typedArray.length - 10} more`, ANSI.dim)
            : `... ${typedArray.length - 10} more`;
        return `${indent}${header} [${preview}, ${moreStr}]`;
    }

    // ArrayBuffer
    if (value instanceof ArrayBuffer) {
        const header = c
            ? paint(`ArrayBuffer(${value.byteLength})`, ANSI.cyan)
            : `ArrayBuffer(${value.byteLength})`;
        return `${indent}${header}`;
    }

    // Array
    if (Array.isArray(value)) {
        const lines: string[] = [];

        if (value.length === 0) {
            return `${indent}${c ? paint("[]", ANSI.dim) : "[]"}`;
        }

        const header = c
            ? paint(`Array(${value.length})`, ANSI.dim)
            : `Array(${value.length})`;
        lines.push(`${indent}${header}`);

        const limited = value.slice(0, options.maxArrayLength);

        limited.forEach((item, i) => {
            const isLast =
                i === limited.length - 1 && limited.length === value.length;
            const connector = isLast ? corner : tee;
            const indexLabel = c
                ? paint(`[${i}]`, ANSI.dim)
                : `[${i}]`;

            if (
                !isPrimitive(item) &&
                typeof item === "object" &&
                item !== null
            ) {
                lines.push(`${indent}  ${connector} ${indexLabel}`);
                lines.push(
                    serializeTree(
                        item,
                        {
                            ...options,
                            depth: options.depth + 1,
                            indent: options.indent + 2,
                            isRoot: false,
                        },
                        visited,
                    ),
                );
            } else {
                lines.push(
                    `${indent}  ${connector} ${indexLabel} ${serializeInline(item, options)}`,
                );
            }
        });

        if (limited.length < value.length) {
            const remaining = value.length - limited.length;
            const moreStr = c
                ? paint(`... ${remaining} more items`, ANSI.dim)
                : `... ${remaining} more items`;
            lines.push(`${indent}  ${corner} ${moreStr}`);
        }

        return lines.join("\n");
    }

    // Plain objects and class instances
    if (typeof value === "object" && value !== null) {
        const lines: string[] = [];
        const keys = Object.keys(value as Record<string, unknown>);
        const constructorName = getConstructorName(value);
        const isPlain = isPlainObject(value);

        if (keys.length === 0) {
            const empty = isPlain ? "{}" : `${constructorName} {}`;
            return `${indent}${c ? paint(empty, ANSI.dim) : empty}`;
        }

        // Show constructor name for non-plain objects
        if (!isPlain) {
            const header = c
                ? paint(constructorName, ANSI.cyan)
                : constructorName;
            lines.push(`${indent}${header}`);
        }

        keys.forEach((key, i) => {
            const isLast = i === keys.length - 1;
            const connector = isLast ? corner : tee;
            const keyLabel = c ? paint(key, ANSI.cyan) : key;
            const val = (value as Record<string, unknown>)[key];

            if (
                !isPrimitive(val) &&
                typeof val === "object" &&
                val !== null
            ) {
                lines.push(`${indent}  ${connector} ${keyLabel}:`);
                lines.push(
                    serializeTree(
                        val,
                        {
                            ...options,
                            depth: options.depth + 1,
                            indent: options.indent + 2,
                            isRoot: false,
                        },
                        visited,
                    ),
                );
            } else {
                lines.push(
                    `${indent}  ${connector} ${keyLabel}: ${serializeInline(val, options)}`,
                );
            }
        });

        return lines.join("\n");
    }

    // Fallback
    return `${indent}${String(value)}`;
}

/**
 * Main serialization function
 * Determines whether to use inline or tree format based on value complexity
 */
export function serialize(
    value: unknown,
    options: Partial<SerializerOptions> = {},
): string {
    const opts = getDefaultOptions(options);

    // Primitives always use inline
    if (isPrimitive(value)) {
        return serializeInline(value, opts);
    }

    // Simple values use inline
    if (isDate(value) || isRegExp(value) || isFunction(value) || isPromise(value)) {
        return serializeInline(value, opts);
    }

    // Empty arrays/objects use inline
    if (Array.isArray(value) && value.length === 0) {
        return serializeInline(value, opts);
    }

    if (isPlainObject(value) && Object.keys(value).length === 0) {
        return serializeInline(value, opts);
    }

    // Everything else uses tree format
    return serializeTree(value, opts);
}

/**
 * Serialize a value for JSON output (production mode)
 * Handles special types that JSON.stringify can't handle
 */
export function serializeForJSON(value: unknown): unknown {
    const seen = new WeakSet();

    function transform(val: unknown): unknown {
        if (val === null || val === undefined) return val;
        if (typeof val === "string" || typeof val === "number" || typeof val === "boolean") return val;

        if (typeof val === "bigint") return `${val}n`;
        if (typeof val === "symbol") return val.toString();
        if (typeof val === "function") return `[Function: ${val.name || "anonymous"}]`;

        if (typeof val !== "object" || val === null) return String(val);

        // Circular reference check
        if (seen.has(val)) return "[Circular]";
        seen.add(val);

        if (isError(val)) {
            const errorObj: Record<string, unknown> = {
                name: val.name,
                message: val.message,
                stack: val.stack,
            };

            if (isAppError(val)) {
                errorObj.code = val.code;
                errorObj.statusCode = val.statusCode;
                errorObj.details = val.details;
            }

            if (val.cause) {
                errorObj.cause = transform(val.cause);
            }

            return errorObj;
        }

        if (isDate(val)) return val.toISOString();
        if (isRegExp(val)) return { source: val.source, flags: val.flags };
        if (isMap(val)) return { __type: "Map", entries: Array.from(val.entries()).map(([k, v]) => [transform(k), transform(v)]) };
        if (isSet(val)) return { __type: "Set", values: Array.from(val.values()).map(transform) };

        if (ArrayBuffer.isView(val) && !(val instanceof DataView)) {
            return Array.from(val as unknown as ArrayLike<number>);
        }

        if (val instanceof ArrayBuffer) {
            return { __type: "ArrayBuffer", byteLength: val.byteLength };
        }

        if (Array.isArray(val)) {
            return val.map(transform);
        }

        // Plain objects and class instances
        const result: Record<string, unknown> = {};
        for (const key of Object.keys(val as Record<string, unknown>)) {
            result[key] = transform((val as Record<string, unknown>)[key]);
        }
        return result;
    }

    return transform(value);
}
