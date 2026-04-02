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
        },
      );
    }

    const body = purchaseSchema.parse(await req.json());

    const service = new PaymentPurchaseService();
    const purchase = await service.createPendingPurchase({
      userId: session.user.id,
      ...body,
    });

    if (!purchase) {
      return NextResponse.json(
        { error: "failed_to_create_purchase" },
        { status: 500 },
      );
    }

    const payment = await service.initiateFapshiPayment(purchase.id);

    log.info("purchase_initiated", {
      ...toAuditEntry(authed, "create", "purchase", "success"),
      purchaseId: purchase.id,
      packageId: body.packageId,
      paymentMethod: body.paymentMethod,
    });

    return NextResponse.json(
      { purchase, payment },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (err) {
    return handleError(err, ctx.requestId);
  }
}
