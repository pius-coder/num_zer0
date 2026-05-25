export interface WorkflowStepResult {
  name: string;
  result: unknown;
  completedAt: string;
}

export interface WorkflowContext {
  step<T>(name: string, fn: () => Promise<T>): Promise<T>;
  sleep(ms: number): Promise<void>;
  cancel(workflowRunId: string): Promise<void>;
}

export interface WorkflowDefinition<TInput = unknown> {
  readonly __auraWorkflow: true;
  readonly name: string;
  readonly handler: (ctx: WorkflowContext, input: TInput) => Promise<unknown>;
}

export class WorkflowSleepError extends Error {
  constructor(public readonly ms: number) {
    super(`Workflow sleeping for ${ms}ms`);
    this.name = "WorkflowSleepError";
  }
}

export interface DbWorkflowRun {
  id: string;
  workflowName: string;
  input: unknown;
  status: string;
  completedSteps: unknown;
  completedAt: Date | null;
  startedAt: Date | null;
  currentStep: string | null;
  createdAt: Date;
}

export interface DbJobRun {
  id: string;
  jobName: string;
  operationName: string | null;
  input: unknown;
  status: string;
  runAt: Date;
  attempts: number;
  maxAttempts: number | null;
  startedAt: Date | null;
  completedAt: Date | null;
  finishedAt: Date | null;
  lockedUntil: Date | null;
  lastError: string | null;
  error: string | null;
}

export interface WorkflowDb {
  auraWorkflowRun: {
    create: (args: { data: Record<string, unknown> }) => Promise<DbWorkflowRun>;
    findUnique: (args: { where: { id: string } }) => Promise<DbWorkflowRun | null>;
    update: (args: { where: { id: string }; data: Record<string, unknown> }) => Promise<DbWorkflowRun>;
    updateMany: (args: { where: Record<string, unknown>; data: Record<string, unknown> }) => Promise<{ count: number }>;
  };
  auraJobRun: {
    create: (args: { data: Record<string, unknown> }) => Promise<DbJobRun>;
    findMany: (args: unknown) => Promise<DbJobRun[]>;
    update: (args: { where: { id: string }; data: Record<string, unknown> }) => Promise<DbJobRun>;
    updateMany: (args: { where: Record<string, unknown>; data: Record<string, unknown> }) => Promise<{ count: number }>;
    findUnique: (args: { where: { id: string } }) => Promise<DbJobRun | null>;
  };
}

export interface ProcessScheduledJobsOptions {
  db: WorkflowDb;
  runAuraOperation: (opts: {
    operationName: string;
    input: unknown;
    request: Request;
    source: string;
  }) => Promise<{ envelope: { ok: boolean; error?: { message: string } } }>;
  batchSize?: number;
}

export interface ProcessScheduledJobsResult {
  picked: number;
  succeeded: number;
  failed: number;
}
