import type { WorkflowDb } from "./types";

function toJson(value: unknown): unknown {
  if (value === undefined || value === null) return null;
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return null;
  }
}

function refName(ref: string | { _name: string }): string {
  return typeof ref === "string" ? ref : ref._name;
}

export function createAuraScheduler(db: WorkflowDb) {
  async function schedule(runAt: Date, ref: string | { _name: string }, input: unknown): Promise<string> {
    const operationName = refName(ref);
    const job = await db.auraJobRun.create({
      data: {
        jobName: `scheduler:${operationName}`,
        operationName,
        input: toJson(input ?? null),
        status: "PENDING",
        runAt,
        attempts: 0,
        maxAttempts: 3,
      },
    });
    return job.id;
  }

  return {
    async runAfter(delayMs: number, ref: string | { _name: string; _type: string }, input: unknown) {
      return schedule(new Date(Date.now() + delayMs), ref, input);
    },
    async runAt(timestamp: Date, ref: string | { _name: string; _type: string }, input: unknown) {
      return schedule(timestamp, ref, input);
    },
    async cancel(scheduledId: string) {
      await db.auraJobRun.updateMany({
        where: { id: scheduledId, status: "PENDING" },
        data: { status: "CANCELLED", completedAt: new Date() },
      });
    },
  };
}
