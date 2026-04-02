import { NextResponse } from "next/server";
import { z } from "zod";
import { handleError } from "@/middleware/error-handler";
import {
  extractRequestContext,
  withUser,
  toAuditEntry,
} from "@/middleware/request-context";
import { requireAdminSession } from "@/common/auth/require-admin.server";
import { createLogger } from "@/common/logger";
import { ReportService } from "@/services/report.service";

const log = createLogger({ prefix: "api-admin-dashboard" });

const QuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(365).default(30),
});

export async function GET(req: Request) {
  const ctx = extractRequestContext(req);

  try {
    const session = await requireAdminSession();
    const authed = withUser(ctx, session.user.id);

    const url = new URL(req.url);
    const { days } = QuerySchema.parse({
      days: url.searchParams.get("days") ?? undefined,
    });

    const to = new Date();
    const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);

    const reportService = new ReportService();

    const [kpis, revenueByDay] = await Promise.all([
      reportService.computeAdminKpis(),
      reportService.getRevenueByDay(from, to),
    ]);

    log.info("admin_dashboard_read", {
      ...toAuditEntry(authed, "read", "dashboard", "success"),
      days,
    });

    return NextResponse.json(
      { kpis, revenueByDay, period: { from, to, days } },
      { headers: { "Cache-Control": "private, max-age=60" } },
    );
  } catch (err) {
    return handleError(err, ctx.requestId);
  }
}
