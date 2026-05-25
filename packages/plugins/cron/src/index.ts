export interface AuraCronJob {
  readonly __auraCron: true;
  readonly name: string;
  readonly schedule?: string;
  readonly handler: (ctx: { requestId: string; source: string }) => Promise<void>;
}

export interface RunAuraCronResult {
  status: "succeeded" | "failed";
  error?: string;
  startedAt: Date;
  finishedAt: Date;
}
