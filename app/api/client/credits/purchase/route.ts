import { NextResponse } from "next/server";
import { z } from "zod";
import { handleError } from "@/middleware/error-handler";
import {
  extractRequestContext,
  withUser,
  toAuditEntry,
} from "@/middleware/request-context";
import { rateLimit, getClientKey } from "@/middleware/rate-limit";
import { requireSession } from "@/common/auth/api-auth.server";
import { createLogger } from "@/common/logger";
import { PaymentPurchaseService } from "@/services/payment-purchase.service";

const log = createLogger({ prefix: "api-credits-purchase" });

const purchaseSchema = z.object({
  packageId: z.string().min(1),
  paymentMethod: z.enum([
    "mtn_momo",
    "orange_money",
    "card",
    "bank_transfer",
    "crypto",
  ]),
  idempotencyKey: z.string().min(1),
});

export async function POST(req: Request) {
  const ctx = extractRequestContext(req);

  try {
    const session = await requireSession();
    const authed = withUser(ctx, session.user.id);

    const key = getClientKey(session.user.id, req);
    const { allowed, retryAfterMs } = rateLimit(key, {
      max: 5,
      windowMs: 60_000,
    });
    if (!allowed) {
      return NextResponse.json(
        { error: "rate_limited", message: "Too many requests" },
        {
          status: 429,
          headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) },
        }
      );
    }

    // Safe parsing to capture malformed bodies
    let rawBody: any;
    try {
      rawBody = await req.json();
    } catch {
      log.error("invalid_json_body", { slug: "fapshi-purchase-error" });
      return NextResponse.json({ error: "invalid_json" }, { status: 400 });
    }

    log.info("purchase_request_received", {
      slug: "fapshi-purchase-debug",
      body: rawBody,
    });

    const body = purchaseSchema.safeParse(rawBody);
    if (!body.success) {
      log.error("purchase_validation_failed", {
        slug: "fapshi-purchase-error",
        errors: body.error.flatten(),
        body: rawBody,
      });
      return NextResponse.json(
        { error: "invalid_input", details: body.error.flatten() },
        { status: 400 }
      );
    }

    const service = new PaymentPurchaseService();
    const purchase = await service.createPendingPurchase({
      userId: session.user.id,
      ...body.data,
    });

    if (!purchase) {
      log.error("purchase_creation_failed", { slug: "fapshi-purchase-error" });
      return NextResponse.json(
        { error: "failed_to_create_purchase" },
        { status: 500 }
      );
    }

    // Try to initiate payment
    try {
      const payment = await service.initiateFapshiPayment(purchase.id);

      log.info("purchase_initiated", {
        slug: "fapshi-purchase-success",
        ...toAuditEntry(authed, "create", "purchase", "success"),
        purchaseId: purchase.id,
        packageId: body.data.packageId,
        paymentMethod: body.data.paymentMethod,
        fapshiTransId: payment.transId,
      });

      return NextResponse.json(
        { purchase, payment },
        { headers: { "Cache-Control": "no-store" } }
      );
    } catch (fapshiError) {
      log.error("fapshi_payment_init_failed", {
        slug: "fapshi-purchase-error",
        message:
          fapshiError instanceof Error ? fapshiError.message : String(fapshiError),
        purchaseId: purchase.id,
        amount: purchase.priceXaf,
        details: fapshiError instanceof Error ? fapshiError.cause : undefined,
      });
      throw fapshiError;
    }
  } catch (err) {
    log.error("purchase_crash_global", {
      slug: "fapshi-purchase-error",
      error: err instanceof Error ? err.message : String(err),
    });
    return handleError(err, ctx.requestId);
  }
}
