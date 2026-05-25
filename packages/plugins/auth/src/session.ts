import { AuraError } from "@aura/core";
import type { AuraContext } from "@aura/core";
import { hashToken, randomToken, sha256 } from "./crypto";
import { createCsrfToken } from "./csrf";
import { parseCookieHeader, sessionCookieName, csrfCookieName, isSecureCookieEnvironment } from "./cookies";

const SESSION_TTL_DAYS = 30;
const SESSION_TTL_SECONDS = SESSION_TTL_DAYS * 24 * 60 * 60;

export interface AuraSessionRow {
  id: string;
  userId: string;
  expiresAt: Date;
  sessionVersion: number;
  tokenHash: string;
  csrfTokenHash: string;
  lastUsedAt: Date | null;
  revokedAt: Date | null;
  userAgentHash: string | null;
  ipHash: string | null;
  user?: {
    id: string;
    sessionVersion: number;
    disabledAt: Date | null;
    deletedAt: Date | null;
  };
}

export interface ResolvedSession {
  session: { id: string; userId: string; expiresAt: Date; sessionVersion: number } | null;
  user: { id: string; sessionVersion: number; disabledAt: Date | null; deletedAt: Date | null } | null;
}

export async function resolveSessionFromRequest(
  db: { auraSession: { findUnique: (args: { where: { tokenHash: string }; include: { user: boolean } }) => Promise<AuraSessionRow | null>; update: (args: { where: { id: string }; data: Record<string, unknown> }) => Promise<unknown> } },
  request: Request,
): Promise<ResolvedSession> {
  const cookies = parseCookieHeader(request.headers.get("cookie"));
  const token = cookies.get(sessionCookieName());
  if (!token) return { session: null, user: null };

  const tokenHash = hashToken(token);
  const storedSession = await db.auraSession.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!storedSession || storedSession.revokedAt) return { session: null, user: null };

  const now = new Date();
  if (storedSession.expiresAt <= now) {
    await db.auraSession.update({
      where: { id: storedSession.id },
      data: { revokedAt: now },
    });
    throw new AuraError("SESSION_EXPIRED", "La session a expiré.");
  }

  if (storedSession.user!.disabledAt || storedSession.user!.deletedAt) {
    throw new AuraError("SESSION_REVOKED", "Le compte n'est plus actif.");
  }

  if (storedSession.sessionVersion !== storedSession.user!.sessionVersion) {
    await db.auraSession.update({
      where: { id: storedSession.id },
      data: { revokedAt: now },
    });
    throw new AuraError("SESSION_REVOKED", "La session n'est plus valide.");
  }

  const lastUsedAtMs = storedSession.lastUsedAt?.getTime() ?? 0;
  if (now.getTime() - lastUsedAtMs > 60_000) {
    void db.auraSession
      .update({ where: { id: storedSession.id }, data: { lastUsedAt: now } })
      .catch(() => {});
  }

  return {
    session: {
      id: storedSession.id,
      userId: storedSession.userId,
      expiresAt: storedSession.expiresAt,
      sessionVersion: storedSession.sessionVersion,
    },
    user: storedSession.user!,
  };
}

export async function createSession(
  db: { auraUser: { findUnique: (args: { where: { id: string } }) => Promise<{ id: string; sessionVersion: number; disabledAt: Date | null; deletedAt: Date | null } | null> }; auraSession: { create: (args: { data: Record<string, unknown> }) => Promise<AuraSessionRow> } },
  setSessionCookie: (token: string, expiresAt: Date) => void,
  pushCookie: (cookie: { name: string; value: string; options: Record<string, unknown> }) => void,
  request: { userAgent?: string; ip?: string },
  userId: string,
): Promise<void> {
  const token = randomToken(32);
  const csrfToken = await createCsrfToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000);
  const user = await db.auraUser.findUnique({ where: { id: userId } });

  if (!user || user.disabledAt || user.deletedAt) {
    throw new AuraError("UNAUTHORIZED", "Compte indisponible.");
  }

  await db.auraSession.create({
    data: {
      tokenHash: hashToken(token),
      csrfTokenHash: sha256(csrfToken),
      userId,
      expiresAt,
      sessionVersion: user.sessionVersion,
      userAgentHash: request.userAgent ? sha256(request.userAgent) : null,
      ipHash: request.ip ? sha256(request.ip) : null,
    },
  });

  setSessionCookie(token, expiresAt);
  pushCookie({
    name: csrfCookieName(),
    value: csrfToken,
    options: {
      httpOnly: false,
      secure: isSecureCookieEnvironment(),
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_TTL_SECONDS,
      expires: expiresAt,
    },
  });
}

export async function revokeSession(
  db: { auraSession: { update: (args: { where: { id: string }; data: Record<string, unknown> }) => Promise<unknown> } },
  sessionId: string | undefined,
  clearSessionCookie: () => void,
): Promise<void> {
  if (sessionId) {
    await db.auraSession.update({
      where: { id: sessionId },
      data: { revokedAt: new Date() },
    });
  }
  clearSessionCookie();
}

export async function revokeAllUserSessions(
  db: { auraSession: { updateMany: (args: { where: { userId: string; revokedAt: null }; data: Record<string, unknown> }) => Promise<unknown> } },
  userId: string,
): Promise<void> {
  await db.auraSession.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}
