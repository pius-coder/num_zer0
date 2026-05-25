import { defineOperationFn } from "@aura/core";
import { z } from "zod";
import { AuraError } from "@aura/core";
import { hashPassword, verifyPassword, validatePassword } from "./password";
import { normalizePhone } from "./phone";
import { createSession, revokeSession } from "./session";
import { createOtpChallenge, consumeOtpChallenge, AuraOtpPurpose } from "./otp";

const authRegisterSchema = z.object({
  countryCode: z.string(),
  phoneNumber: z.string(),
  password: z.string(),
});

const authLoginSchema = z.object({
  countryCode: z.string(),
  phoneNumber: z.string(),
  password: z.string(),
});

export function createAuthPluginOperations(db: any) {
  const authRegister = defineOperationFn("auth.register")
    .mutate()
    .input(authRegisterSchema)
    .public()
    .handler(async ({ ctx, input }: any) => {
      validatePassword(input.password);
      const phone = normalizePhone({ countryCode: input.countryCode, phoneNumber: input.phoneNumber });
      const existing = await db.auraUser.findUnique({ where: { phoneE164: phone.phoneE164 } });
      if (existing) throw new AuraError("CONFLICT", "Ce numéro est déjà utilisé.");

      const hashed = await hashPassword(input.password);
      const user = await db.auraUser.create({
        data: { phoneE164: phone.phoneE164, phoneCountryCode: phone.countryCode, phoneNationalNumber: phone.nationalNumber },
      });
      await db.auraPhoneIdentity.create({ data: { userId: user.id, phoneE164: phone.phoneE164, verifiedAt: new Date() } });
      await db.auraPasswordCredential.create({ data: { userId: user.id, hash: hashed, current: true } });

      const setCookie = ctx.auth?.setSessionCookie || ((_t: string, _e: Date) => {});
      const pushCookie = (cookie: any) => { if (ctx.cookies?.set) ctx.cookies.set.push(cookie); };
      await createSession(db, setCookie, pushCookie, ctx.request, user.id);

      return { userId: user.id };
    });

  const authLogin = defineOperationFn("auth.login")
    .mutate()
    .input(authLoginSchema)
    .public()
    .handler(async ({ ctx, input }: any) => {
      const phone = normalizePhone({ countryCode: input.countryCode, phoneNumber: input.phoneNumber });
      const user = await db.auraUser.findUnique({ where: { phoneE164: phone.phoneE164 } });
      if (!user) throw new AuraError("UNAUTHORIZED", "Identifiants invalides.");

      const creds = await db.auraPasswordCredential.findMany({
        where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 1,
      });
      const credential = creds?.[0];
      const valid = await verifyPassword(input.password, credential?.hash);
      if (!valid) throw new AuraError("UNAUTHORIZED", "Identifiants invalides.");

      const setCookie = ctx.auth?.setSessionCookie || ((_t: string, _e: Date) => {});
      const pushCookie = (cookie: any) => { if (ctx.cookies?.set) ctx.cookies.set.push(cookie); };
      await createSession(db, setCookie, pushCookie, ctx.request, user.id);

      return { userId: user.id };
    });

  const authLogout = defineOperationFn("auth.logout")
    .mutate()
    .auth()
    .handler(async ({ ctx }: any) => {
      await revokeSession(db, ctx.session?.id, ctx.auth?.clearSessionCookie || (() => {}));
      return { success: true };
    });

  const authMe = defineOperationFn("auth.me")
    .query()
    .auth()
    .handler(async ({ ctx }: any) => {
      return { user: ctx.user ?? null, session: ctx.session ?? null };
    });

  return { authRegister, authLogin, authLogout, authMe };
}
