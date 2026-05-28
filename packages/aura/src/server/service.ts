import type { AuraContext } from "./context";

export class AuraService {
  constructor(protected ctx: AuraContext) {}

  get db() { return this.ctx.db; }
  get user() { return this.ctx.user; }
  get session() { return this.ctx.session; }
  get agent() { return this.ctx.agent; }
  get scheduler() { return this.ctx.scheduler; }
  get storage() { return this.ctx.storage; }
  get log() { return this.ctx.log; }
  get audit() { return this.ctx.audit; }
  get notify() { return this.ctx.notify; }
  get bump() { return this.ctx.bump; }
  get requestId() { return this.ctx.requestId; }
  get source() { return this.ctx.source; }
  get auth() { return this.ctx.auth; }

  runQuery(ref: any, input: any) { return (this.ctx.runQuery as any)(ref, input); }
  runMutation(ref: any, input: any) { return (this.ctx.runMutation as any)(ref, input); }
  runAction(ref: any, input: any) { return (this.ctx.runAction as any)(ref, input); }
  track(input: { read?: string[]; write?: string[] }) { this.ctx.track(input); }
  paginate(model: any, opts: any) { return (this.ctx.paginate as any)(model, opts); }
}
