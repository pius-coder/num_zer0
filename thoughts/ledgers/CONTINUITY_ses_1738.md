---
session: ses_1738
updated: 2026-06-03T08:04:58.009Z
---

<｜｜DSML｜｜tool_calls>
<｜｜DSML｜｜invoke name="spawn_agent">
<｜｜DSML｜｜parameter name="name" string="true">Backend-Convex-Security-Audit</｜｜DSML｜｜parameter>
<｜｜DSML｜｜parameter name="instructions" string="true">You are a security audit agent. Perform a deep security audit of ALL Convex backend code in /home/afreeserv/projects/num_zer0/convex/. Check every file. Report in this exact format:

## Backend Security Audit

### Authentication Guards
- List EVERY Convex mutation/action/query and whether it has proper auth guards
- Flag any function that operates on user data without auth checks
- Check auth.ts and auth.config.ts for misconfiguration

### Input Validation
- Check for missing `v.object()` validators on all mutations/actions
- Identify any raw string inputs without sanitization or length limits
- Flag any places where user-controlled data flows into DB writes

### Injection Vectors
- Check for eval(), Function constructor, dynamic imports from user input
- Check for raw SQL or query construction
- Check for prototype pollution risks in schema validators

### Sensitive Data Exposure
- Check what data queries expose — are there any queries that leak user emails, tokens, balances to unauthorized users
- Check error handling — are raw error messages leaked to clients

### Escrow / Financial Security
- Verify the escrow debit/credit logic (comptabilite.ts) — can a user manipulate the system to get free money?
- Check for race conditions in concurrent mutations
- Verify the refund logic is symmetric with debit

### API Key Management
- How are API keys (SMSONLINEPRO_API_KEY, Fapshi) handled — env vars only?
- Are API keys ever exposed to the client in responses?

Read every .ts file in /home/afreeserv/projects/num_zer0/convex/ and report findings.</｜｜DSML｜｜parameter>
</｜｜DSML｜｜invoke>
<｜｜DSML｜｜invoke name="spawn_agent">
<｜｜DSML｜｜parameter name="name" string="true">Frontend-State-Security-Audit</｜｜DSML｜｜parameter>
<｜｜DSML｜｜parameter name="instructions" string="true">You are a frontend security and state management audit agent. Audit ALL frontend code in /home/afreeserv/projects/num_zer0/src for security issues, state hijacking risks, and request handling vulnerabilities. Report in this exact format:

## Frontend Security & State Audit

### Auth State Management
- Check how auth state is managed (context? store? hooks?)
- Can auth state be manipulated by a user via devtools?
- Are tokens stored securely (httpOnly cookies vs localStorage)?
- Check auth-client.ts and auth-server.ts for vulnerabilities
- Check __root.tsx for auth middleware patterns

### XSS Vectors
- Check for dangerouslySetInnerHTML usage
- Check for raw HTML template interpolation
- Check for user data rendered without escaping
- Check for url/user-controlled strings in href/src attributes

### CSRF / Request Forgery
- How are API calls authenticated? Is there a CSRF token mechanism?
- Check if any mutation calls bypass auth

### State Hijacking
- Check all stores (src/common/stores/) — are they singleton? Can one user session see another's data?
- Check for global mutable state that persists across sessions
- Check for race conditions in state updates

### Routing Security
- Check route definitions — are there routes that should be protected but aren't?
- Check for path traversal risks in dynamic route params
- Check route guards (beforeLoad, loader) for proper auth enforcement

Read ALL .tsx and .ts files in /home/afreeserv/projects/num_zer0/src/ and report findings.</｜｜DSML｜｜parameter>
</｜｜DSML｜｜invoke>
<｜｜DSML｜｜invoke name="spawn_agent">
<｜｜DSML｜｜parameter name="name" string="true">Implementation-Completeness-Audit</｜｜DSML｜｜parameter>
<｜｜DSML｜｜parameter name="instructions" string="true">You are an implementation completeness audit agent. Your job is to trace every user flow end-to-end and identify broken, pending, or incomplete implementations. Report in this exact format:

## Implementation Completeness Audit

### Planned vs Actual (SMS Integration)
Compare the plan at /home/afreeserv/projects/num_zer0/thoughts/shared/plans/2026-06-02-sms-online-pro-phase1-plan.md with actual code:
- Check if task 1.1 (EUR→USD rename) is fully done in src/components/services/data.ts
- Check if task 1.2 (country code mapping) is done — compare convex/sms_countries.ts with the design doc's telephone codes
- Check if task 1.3 (schema) has the activations table properly defined in convex/schema.ts
- Check if task 1.4 (type) is done in src/type/sms_activation.ts
- Check if task 1.5 (accounting) is done — are the new accounts 471/472/511/5111/5112 in comptabilite.ts?
- Check if task 2.1 (core module) is done — does convex/sms_provider.ts export all needed functions?
- Check if task 3.1 (client hooks) properly wires up in src/components/purchases/hooks/
- Check if task 3.2 (barrel exports) — do the barrel files export everything?

### User Flow Tracing
Trace each user flow completely through the code:
1. **Auth flow**: anonymous → quick access → full auth → protected routes
2. **Recharge flow**: click recharge → method selection → payment → callback → balance update
3. **Purchase flow**: browse services → select → purchase → activation → SMS receipt
4. **Wallet flow**: view balance → transaction history → details drawer

For each flow, identify: what's working, what's broken, what's missing.

### File Permissions & Build
- Check if the untracked SMS files have proper permissions
- Identify any import/export chains that are broken

Read the relevant files and trace the code paths.</｜｜DSML｜｜parameter>
</｜｜DSML｜｜invoke>
</｜｜DSML｜｜tool_calls>
