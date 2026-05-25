import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export function randomToken(byteLength = 32): string {
  return randomBytes(byteLength).toString("base64url");
}

export function randomNumericCode(length = 8): string {
  const digits: string[] = [];
  while (digits.length < length) {
    const value = randomBytes(1)[0];
    if (value! < 250) digits.push(String(value! % 10));
  }
  return digits.join("");
}

export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function hmacSha256(value: string, secret: string): string {
  return createHmac("sha256", secret).update(value).digest("hex");
}

export function secureCompare(a: string, b: string): boolean {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);
  if (aBuffer.length !== bBuffer.length) return false;
  return timingSafeEqual(aBuffer, bBuffer);
}

let cachedSecret: string | null = null;

export function getAuraSecret(): string {
  if (cachedSecret) return cachedSecret;
  const provided = process.env.AURA_INTERNAL_SECRET || process.env.AURA_CSRF_SECRET;
  cachedSecret = provided || "aura-dev-secret-change-me";
  return cachedSecret;
}

export function hashToken(token: string): string {
  return sha256(token);
}

export function hashOtpCode(args: { challengeId: string; phoneE164: string; purpose: string; code: string }): string {
  return hmacSha256(`${args.challengeId}:${args.phoneE164}:${args.purpose}:${args.code}`, getAuraSecret());
}
