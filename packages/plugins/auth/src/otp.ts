import { AuraError } from "@aura/core";
import { hashOtpCode, randomNumericCode, randomToken } from "./crypto";

const OTP_TTL_MINUTES = 10;
const OTP_MAX_ATTEMPTS = 5;

export const AuraOtpPurpose = {
  REGISTER_PHONE: "REGISTER_PHONE",
  LOGIN_PHONE: "LOGIN_PHONE",
  RESET_PASSWORD: "RESET_PASSWORD",
  CHANGE_PHONE: "CHANGE_PHONE",
  SENSITIVE_ACTION: "SENSITIVE_ACTION",
} as const;

export type AuraOtpPurposeValue = (typeof AuraOtpPurpose)[keyof typeof AuraOtpPurpose];

export function publicOtpPurpose(purpose: AuraOtpPurposeValue): string {
  const map: Record<AuraOtpPurposeValue, string> = {
    REGISTER_PHONE: "register_phone",
    LOGIN_PHONE: "login_phone",
    RESET_PASSWORD: "reset_password",
    CHANGE_PHONE: "change_phone",
    SENSITIVE_ACTION: "sensitive_action",
  };
  return map[purpose];
}

interface OtpChallengeRow {
  id: string;
  userId: string | null;
  phoneE164: string;
  purpose: AuraOtpPurposeValue;
  codeHash: string;
  expiresAt: Date;
  maxAttempts: number;
  attempts: number;
  consumedAt: Date | null;
}

interface TransactionClient {
  auraOtpChallenge: {
    findUnique: (args: { where: { id: string } }) => Promise<OtpChallengeRow | null>;
    update: (args: { where: { id: string }; data: Record<string, unknown> }) => Promise<unknown>;
  };
}

export async function createOtpChallenge(
  db: {
    auraOtpChallenge: {
      updateMany: (args: { where: { phoneE164: string; purpose: AuraOtpPurposeValue; consumedAt: null }; data: { consumedAt: Date } }) => Promise<unknown>;
      create: (args: { data: Record<string, unknown> }) => Promise<OtpChallengeRow>;
    };
  },
  args: { phoneE164: string; purpose: AuraOtpPurposeValue; userId?: string; metadata?: Record<string, unknown> },
): Promise<{ challengeId: string; code: string; expiresAt: Date }> {
  const challengeId = `otp_${randomToken(18)}`;
  const code = randomNumericCode(8);
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

  await db.auraOtpChallenge.updateMany({
    where: { phoneE164: args.phoneE164, purpose: args.purpose, consumedAt: null },
    data: { consumedAt: new Date() },
  });

  await db.auraOtpChallenge.create({
    data: {
      id: challengeId,
      userId: args.userId ?? null,
      phoneE164: args.phoneE164,
      purpose: args.purpose,
      codeHash: hashOtpCode({ challengeId, phoneE164: args.phoneE164, purpose: args.purpose, code }),
      expiresAt,
      maxAttempts: OTP_MAX_ATTEMPTS,
      metadata: args.metadata ?? null,
    },
  });

  return { challengeId, code, expiresAt };
}

export async function consumeOtpChallenge(
  db: {
    $transaction: <T>(fn: (tx: TransactionClient) => Promise<T>) => Promise<T>;
  },
  args: { challengeId: string; code: string; purpose: AuraOtpPurposeValue },
): Promise<{ userId: string | null; phoneE164: string }> {
  return db.$transaction(async (tx) => {
    const challenge = await tx.auraOtpChallenge.findUnique({ where: { id: args.challengeId } });

    if (!challenge || challenge.purpose !== args.purpose || challenge.consumedAt) {
      throw new AuraError("OTP_INVALID", "Code de vérification invalide.");
    }

    if (challenge.expiresAt <= new Date()) {
      await tx.auraOtpChallenge.update({ where: { id: challenge.id }, data: { consumedAt: new Date() } });
      throw new AuraError("OTP_EXPIRED", "Le code de vérification a expiré.");
    }

    if (challenge.attempts >= challenge.maxAttempts) {
      throw new AuraError("RATE_LIMITED", "Trop de tentatives pour ce code.");
    }

    const expectedHash = hashOtpCode({
      challengeId: challenge.id,
      phoneE164: challenge.phoneE164,
      purpose: challenge.purpose,
      code: args.code.trim(),
    });

    if (expectedHash !== challenge.codeHash) {
      await tx.auraOtpChallenge.update({ where: { id: challenge.id }, data: { attempts: { increment: 1 } } });
      throw new AuraError("OTP_INVALID", "Code de vérification invalide.");
    }

    await tx.auraOtpChallenge.update({ where: { id: challenge.id }, data: { attempts: { increment: 1 }, consumedAt: new Date() } });

    return { userId: challenge.userId, phoneE164: challenge.phoneE164 };
  });
}
