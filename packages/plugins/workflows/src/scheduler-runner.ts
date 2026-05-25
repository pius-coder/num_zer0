import type { ProcessScheduledJobsOptions, ProcessScheduledJobsResult } from "./types";

const LOCK_DURATION_MS = 60_000;

export async function processScheduledJobs(
  options: ProcessScheduledJobsOptions,
): Promise<ProcessScheduledJobsResult> {
  const batchSize = options.batchSize ?? 50;
  const { db, runAuraOperation } = options;
  const now = new Date();

  const candidates = await db.auraJobRun.findMany({
    where: {
      status: { in: ["PENDING", "RUNNING"] },
      runAt: { lte: now },
      OR: [
        { lockedUntil: null },
        { lockedUntil: { lte: now } },
      ],
    },
    take: batchSize,
    orderBy: { runAt: "asc" },
  });

  let succeeded = 0;
  let failed = 0;

  for (const job of candidates) {
    if (!job.operationName) {
      continue;
    }

    const claim = await db.auraJobRun.updateMany({
      where: {
        id: job.id,
        OR: [{ lockedUntil: null }, { lockedUntil: { lte: now } }],
      },
      data: {
        status: "RUNNING",
        startedAt: now,
        lockedUntil: new Date(now.getTime() + LOCK_DURATION_MS),
        attempts: { increment: 1 },
      },
    });
    if (claim.count === 0) continue;

    try {
      const result = await runAuraOperation({
        operationName: job.operationName,
        input: job.input,
        request: new Request("aura://scheduler"),
        source: "scheduler",
      });

      if (result.envelope.ok) {
        await db.auraJobRun.update({
          where: { id: job.id },
          data: {
            status: "SUCCEEDED",
            completedAt: new Date(),
            finishedAt: new Date(),
            lockedUntil: null,
          },
        });
        succeeded += 1;
      } else {
        throw new Error(result.envelope.error?.message ?? "Unknown error");
      }
    } catch (error) {
      const lastError = error instanceof Error ? error.message : String(error);
      const refreshed = await db.auraJobRun.findUnique({ where: { id: job.id } });
      const attempts = (refreshed?.attempts ?? job.attempts) + 1;
      const maxAttempts = job.maxAttempts ?? 3;

      if (attempts >= maxAttempts) {
        await db.auraJobRun.update({
          where: { id: job.id },
          data: {
            status: "FAILED",
            lastError,
            error: lastError,
            completedAt: new Date(),
            finishedAt: new Date(),
            lockedUntil: null,
          },
        });
        failed += 1;
      } else {
        const backoffMs = Math.min(1000 * 2 ** attempts, 60 * 60 * 1000);
        await db.auraJobRun.update({
          where: { id: job.id },
          data: {
            status: "PENDING",
            lastError,
            runAt: new Date(Date.now() + backoffMs),
            lockedUntil: null,
          },
        });
      }
    }
  }

  return { picked: candidates.length, succeeded, failed };
}
