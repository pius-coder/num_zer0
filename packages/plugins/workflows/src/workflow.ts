import { randomUUID } from "node:crypto";
import type { WorkflowStepResult, WorkflowContext, WorkflowDefinition, WorkflowDb, WorkflowSleepError as WorkflowSleepErrorType } from "./types";
import { WorkflowSleepError } from "./types";

function toJson(value: unknown): unknown {
  if (value === undefined || value === null) return null;
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return null;
  }
}

const workflowRegistry = new Map<string, WorkflowDefinition>();

export function defineWorkflow<TInput = unknown>(name: string) {
  return {
    handler(fn: (ctx: WorkflowContext, input: TInput) => Promise<unknown>): WorkflowDefinition<TInput> {
      const def: WorkflowDefinition<TInput> = {
        __auraWorkflow: true,
        name,
        handler: fn,
      };
      workflowRegistry.set(name, def as WorkflowDefinition);
      return def;
    },
  };
}

export function getWorkflow(name: string): WorkflowDefinition | null {
  return workflowRegistry.get(name) ?? null;
}

export function listWorkflows(): WorkflowDefinition[] {
  return [...workflowRegistry.values()];
}

export async function startWorkflow(
  name: string,
  input: unknown,
  db: WorkflowDb,
): Promise<string> {
  const def = workflowRegistry.get(name);
  if (!def) throw new Error(`Workflow introuvable: ${name}`);

  const run = await db.auraWorkflowRun.create({
    data: {
      id: randomUUID(),
      workflowName: name,
      input: toJson(input ?? null) ?? {},
      status: "PENDING",
      completedSteps: toJson([]) ?? [],
    },
  });

  return run.id;
}

export async function executeWorkflowRun(
  runId: string,
  db: WorkflowDb,
): Promise<{ status: string; result?: unknown; error?: string }> {
  const run = await db.auraWorkflowRun.findUnique({ where: { id: runId } });
  if (!run) throw new Error(`Workflow run introuvable: ${runId}`);
  if (run.status === "COMPLETED" || run.status === "CANCELLED") {
    return { status: run.status };
  }

  const def = workflowRegistry.get(run.workflowName);
  if (!def) throw new Error(`Workflow introuvable: ${run.workflowName}`);

  await db.auraWorkflowRun.update({
    where: { id: runId },
    data: { status: "RUNNING", startedAt: run.startedAt ?? new Date() },
  });

  const completedSteps: WorkflowStepResult[] = (run.completedSteps as unknown as WorkflowStepResult[]) ?? [];
  const completedMap = new Map(completedSteps.map((s) => [s.name, s]));

  const ctx: WorkflowContext = {
    async step<T>(name: string, fn: () => Promise<T>): Promise<T> {
      const cached = completedMap.get(name);
      if (cached) return cached.result as T;

      await db.auraWorkflowRun.update({
        where: { id: runId },
        data: { currentStep: name },
      });

      const result = await fn();

      const stepResult: WorkflowStepResult = {
        name,
        result,
        completedAt: new Date().toISOString(),
      };
      completedSteps.push(stepResult);
      completedMap.set(name, stepResult);

      await db.auraWorkflowRun.update({
        where: { id: runId },
        data: { completedSteps: toJson(completedSteps) },
      });

      return result;
    },

    async sleep(ms: number): Promise<void> {
      const sleepStepName = `__sleep_${Date.now()}`;
      const cached = completedMap.get(sleepStepName);
      if (cached) return;

      await db.auraJobRun.create({
        data: {
          jobName: `workflow:resume:${runId}`,
          operationName: `__workflow.resume`,
          input: toJson({ runId }),
          status: "PENDING",
          runAt: new Date(Date.now() + ms),
          attempts: 0,
          maxAttempts: 3,
        },
      });

      completedSteps.push({ name: sleepStepName, result: null, completedAt: new Date().toISOString() });
      await db.auraWorkflowRun.update({
        where: { id: runId },
        data: { completedSteps: toJson(completedSteps), status: "SLEEPING" },
      });

      throw new WorkflowSleepError(ms);
    },

    async cancel(workflowRunId: string): Promise<void> {
      await db.auraWorkflowRun.updateMany({
        where: { id: workflowRunId, status: { in: ["PENDING", "RUNNING", "SLEEPING"] } },
        data: { status: "CANCELLED", completedAt: new Date() },
      });
    },
  };

  try {
    const result = await def.handler(ctx, run.input);
    await db.auraWorkflowRun.update({
      where: { id: runId },
      data: { status: "COMPLETED", completedAt: new Date(), currentStep: null },
    });
    return { status: "COMPLETED", result };
  } catch (error) {
    if ((error as WorkflowSleepErrorType)?.name === "WorkflowSleepError") {
      return { status: "SLEEPING" };
    }
    const errorMsg = error instanceof Error ? error.message : String(error);
    await db.auraWorkflowRun.update({
      where: { id: runId },
      data: { status: "FAILED", error: errorMsg, completedAt: new Date() },
    });
    return { status: "FAILED", error: errorMsg };
  }
}
