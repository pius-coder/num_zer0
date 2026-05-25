import { mkdir, writeFile, unlink } from "node:fs/promises";
import { dirname, join } from "node:path";
import { randomBytes } from "node:crypto";
import type { AuraStorageDriver, AuraStorageUploadArgs, AuraStorageUploadResult } from "./types";

const STORAGE_PATH = process.env.AURA_STORAGE_PATH || "storage/files";
const STORAGE_PUBLIC_PREFIX = process.env.AURA_STORAGE_PUBLIC_PREFIX || "/api/files";

function generateShortUuid(length = 10): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = randomBytes(length);
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars[bytes[i]! % chars.length];
  }
  return result;
}

function sanitizeFileName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9-_.]/g, "-").replace(/\.+/g, ".").replace(/^-+|-+$/g, "");
}

function parseDataUrl(dataUrl: string): { mimeType: string; extension: string; buffer: Buffer } {
  const match = dataUrl.match(/^data:(image\/(png|jpeg|jpg|webp|gif)|application\/pdf|text\/plain);base64,(.+)$/);
  if (!match) throw new Error("Format de fichier non supporté.");
  const mimeType = match[1]!;
  const ext = (match[2] === "jpeg" ? "jpg" : match[2])!;
  return { mimeType, extension: ext || "bin", buffer: Buffer.from(match[3]!, "base64") };
}

function resolveFilePath(key: string): string {
  const base = join(process.cwd(), STORAGE_PATH);
  const target = join(base, key);
  if (!target.startsWith(base + "/") && target !== base) {
    throw new Error("Invalid file key: path traversal detected.");
  }
  return target;
}

export const filesystemDriver: AuraStorageDriver = {
  name: "filesystem",
  async upload(args: AuraStorageUploadArgs): Promise<AuraStorageUploadResult> {
    let buffer: Buffer;
    let mimeType: string;
    let extension: string;

    if (typeof args.data === "string" && args.data.startsWith("data:")) {
      const parsed = parseDataUrl(args.data);
      buffer = parsed.buffer;
      mimeType = parsed.mimeType;
      extension = parsed.extension;
    } else if (Buffer.isBuffer(args.data)) {
      buffer = args.data;
      mimeType = "application/octet-stream";
      extension = "bin";
    } else {
      throw new Error("Invalid data: expected Buffer or data URL string.");
    }

    const safeName = sanitizeFileName(args.fileName);
    const shortUuid = generateShortUuid(10);
    const key = `${args.prefix}/${shortUuid}-${safeName}.${extension}`;
    const filePath = resolveFilePath(key);

    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, buffer);

    const appUrl = process.env.AURA_APP_URL || "";
    const url = `${appUrl.replace(/\/$/, "")}${STORAGE_PUBLIC_PREFIX}/${key}`;

    return { id: key, key, url, mimeType, size: buffer.byteLength };
  },
  async delete(keyOrUrl: string): Promise<void> {
    const key = keyOrUrl.includes("/") && !keyOrUrl.startsWith("http")
      ? keyOrUrl.split("/").slice(-3).join("/")
      : keyOrUrl;
    const filePath = resolveFilePath(key);
    try { await unlink(filePath); } catch { }
  },
};
