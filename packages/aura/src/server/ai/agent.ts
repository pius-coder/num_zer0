import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import type { StructuredToolInterface } from "@langchain/core/tools";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { HumanMessage, SystemMessage, AIMessage, ToolMessage } from "@langchain/core/messages";
import type { BaseMessage } from "@langchain/core/messages";
import { z } from "zod";
import { db } from "../db";
import type { AuraDb } from "../db";
import { publishInvalidation } from "../invalidate";
import { v4 as uuidv4 } from "uuid";
import { toPrismaJson } from "../json";
import type { OperationRef } from "@/aura/core/types";
import type { AuraContext } from "../context";

export interface AgentToolDef {
  name: string;
  description: string;
  parameters: z.ZodType;
  execute: (input: unknown) => Promise<unknown>;
  requiresApproval?: boolean;
}

export interface AgentRAGConfig {
  sources: string[];
  topK?: number;
  strategy?: "vector" | "text" | "hybrid";
}

export interface AgentDefinition {
  readonly __auraAgent: true;
  readonly name: string;
  readonly _name: string;
  readonly model: BaseChatModel;
  readonly systemPrompt: string;
  readonly tools: AgentToolDef[];
  readonly maxSteps: number;
  readonly rag?: AgentRAGConfig;
  readonly handler?: (args: { ctx: AuraContext; input: unknown }) => Promise<unknown>;
}

export interface DefineAgentOptions {
  model: BaseChatModel;
  systemPrompt: string;
  tools?: AgentToolDef[];
  maxSteps?: number;
  rag?: AgentRAGConfig;
}

const agentRegistry = new Map<string, AgentDefinition>();

export function getAgent(name: string): AgentDefinition | null {
  return agentRegistry.get(name) ?? null;
}

export function listAgents(): AgentDefinition[] {
  return [...agentRegistry.values()];
}

interface AgentBuilder {
  model(m: BaseChatModel): this & { handler(h: AgentDefinition["handler"]): AgentDefinition };
  systemPrompt(s: string): this & { handler(h: AgentDefinition["handler"]): AgentDefinition };
  tools(t: AgentToolDef[]): this & { handler(h: AgentDefinition["handler"]): AgentDefinition };
  maxSteps(n: number): this & { handler(h: AgentDefinition["handler"]): AgentDefinition };
  rag(r: AgentRAGConfig): this & { handler(h: AgentDefinition["handler"]): AgentDefinition };
  handler(h: AgentDefinition["handler"]): AgentDefinition;
}

export function defineAgent(name: string): AgentBuilder {
  const state: {
    model?: BaseChatModel;
    systemPrompt?: string;
    tools?: AgentToolDef[];
    maxSteps?: number;
    rag?: AgentRAGConfig;
    handler?: AgentDefinition["handler"];
  } = {};

  const finalize = () => {
    if (!state.model) throw new Error(`[aura] Agent "${name}" requires .model()`);
    if (!state.systemPrompt) throw new Error(`[aura] Agent "${name}" requires .systemPrompt()`);

    const def: AgentDefinition = {
      __auraAgent: true,
      name,
      _name: name,
      model: state.model!,
      systemPrompt: state.systemPrompt!,
      tools: state.tools ?? [],
      maxSteps: state.maxSteps ?? 10,
      rag: state.rag,
      handler: state.handler,
    };
    agentRegistry.set(name, def);
    return def;
  };

  const builder = {
    model(m: BaseChatModel) {
      state.model = m;
      return builder;
    },
    systemPrompt(s: string) {
      state.systemPrompt = s;
      return builder;
    },
    tools(t: AgentToolDef[]) {
      state.tools = t;
      return builder;
    },
    maxSteps(n: number) {
      state.maxSteps = n;
      return builder;
    },
    rag(r: AgentRAGConfig) {
      state.rag = r;
      return builder;
    },
    handler(h: AgentDefinition["handler"]) {
      state.handler = h;
      return finalize();
    },
  };

  return builder as AgentBuilder;
}

export async function createThread(
  agentName: string,
  opts: { userId?: string; title?: string; metadata?: Record<string, unknown> } = {},
  prisma: AuraDb = db,
): Promise<string> {
  const thread = await prisma.auraAgentThread.create({
    data: {
      id: uuidv4(),
      agentName,
      userId: opts.userId ?? null,
      title: opts.title ?? null,
      metadata: opts.metadata ? toPrismaJson(opts.metadata) : undefined,
    },
  });
  return thread.id;
}

export async function getThreadMessages(
  threadId: string,
  opts: { limit?: number } = {},
  prisma: AuraDb = db,
) {
  return prisma.auraAgentMessage.findMany({
    where: { threadId },
    orderBy: { createdAt: "asc" },
    take: opts.limit,
  });
}

export function operationAsTool(
  ref: OperationRef,
  opts: { description: string; requiresApproval?: boolean },
): AgentToolDef {
  return {
    name: ref._name,
    description: opts.description,
    parameters: z.record(z.unknown()),
    requiresApproval: opts.requiresApproval,
    async execute(input) {
      const { getOperation } = await import("../registry");
      const op = getOperation(ref._name);
      if (!op) throw new Error(`Operation not found: ${ref._name}`);
      const { createAuraContext } = await import("../create-context");
      const ctx = await createAuraContext({ source: "internal", requestId: uuidv4() });
      return op.execute({ ctx, input, params: undefined, req: undefined });
    },
  };
}

function toLangChainTool(def: AgentToolDef): StructuredToolInterface {
  return new DynamicStructuredTool({
    name: def.name,
    description: def.description,
    schema: def.parameters instanceof z.ZodType ? def.parameters : z.record(z.unknown()),
    func: async (input) => {
      const result = await def.execute(input);
      return JSON.stringify(result);
    },
  });
}

export interface GenerateTextOptions {
  threadId: string;
  prompt: string;
  userId?: string;
  maxSteps?: number;
}

export async function generateText(
  agentName: string,
  options: GenerateTextOptions,
  prisma: AuraDb = db,
): Promise<{ content: string; messageId: string; usage?: { inputTokens: number; outputTokens: number } }> {
  const agent = agentRegistry.get(agentName);
  if (!agent) throw new Error(`Agent not found: ${agentName}`);

  await prisma.auraAgentMessage.create({
    data: { id: uuidv4(), threadId: options.threadId, role: "user", content: options.prompt },
  });

  const history = await getThreadMessages(options.threadId, { limit: 50 }, prisma);
  const messages: BaseMessage[] = [
    new SystemMessage(agent.systemPrompt),
    ...history.map((m) => {
      if (m.role === "user") return new HumanMessage(m.content);
      if (m.role === "assistant") return new AIMessage(m.content);
      if (m.role === "tool") return new ToolMessage({ content: m.content, tool_call_id: m.id });
      return new HumanMessage(m.content);
    }),
  ];

  const tools = agent.tools.map(toLangChainTool);
  const maxSteps = options.maxSteps ?? agent.maxSteps;
  let response: BaseMessage;
  let totalInput = 0;
  let totalOutput = 0;

  for (let step = 0; step < maxSteps; step++) {
    const modelWithTools = tools.length > 0 && typeof (agent.model as { bindTools?: unknown }).bindTools === "function"
      ? ((agent.model as unknown as { bindTools: (t: unknown[]) => BaseChatModel }).bindTools(tools))
      : agent.model;

    response = await modelWithTools.invoke(messages);
    messages.push(response);

    const usageMeta = (response as unknown as { usage_metadata?: { input_tokens?: number; output_tokens?: number } }).usage_metadata;
    if (usageMeta) {
      totalInput += usageMeta.input_tokens ?? 0;
      totalOutput += usageMeta.output_tokens ?? 0;
    }

    const toolCalls = (response as AIMessage).tool_calls;
    if (!toolCalls || toolCalls.length === 0) break;

    for (const tc of toolCalls) {
      const toolDef = agent.tools.find((t) => t.name === tc.name);
      if (!toolDef) {
        messages.push(new ToolMessage({ content: `Tool not found: ${tc.name}`, tool_call_id: tc.id! }));
        continue;
      }

      if (toolDef.requiresApproval) {
        await prisma.auraAgentMessage.create({
          data: {
            id: uuidv4(),
            threadId: options.threadId,
            role: "tool",
            content: `[APPROVAL_REQUIRED] Tool: ${tc.name}, Args: ${JSON.stringify(tc.args)}`,
            toolCalls: toPrismaJson([{ id: tc.id, name: tc.name, args: tc.args }]),
            metadata: toPrismaJson({ status: "pending_approval" }),
          },
        });
        const msgId = uuidv4();
        await prisma.auraAgentMessage.create({
          data: { id: msgId, threadId: options.threadId, role: "assistant", content: `En attente d'approbation pour l'action: ${tc.name}` },
        });
        return { content: `En attente d'approbation pour l'action: ${tc.name}`, messageId: msgId };
      }

      const result = await toolDef.execute(tc.args);
      messages.push(new ToolMessage({ content: JSON.stringify(result), tool_call_id: tc.id! }));

      await prisma.auraAgentMessage.create({
        data: {
          id: uuidv4(),
          threadId: options.threadId,
          role: "tool",
          content: JSON.stringify(result),
          toolCalls: toPrismaJson([{ id: tc.id, name: tc.name, args: tc.args }]),
          toolResults: toPrismaJson([{ id: tc.id, result }]),
        },
      });
    }
  }

  const content = typeof response!.content === "string" ? response!.content : JSON.stringify(response!.content);
  const messageId = uuidv4();
  await prisma.auraAgentMessage.create({
    data: { id: messageId, threadId: options.threadId, role: "assistant", content },
  });

  if (totalInput > 0 || totalOutput > 0) {
    await prisma.auraAIUsage.create({
      data: {
        id: uuidv4(),
        agentName,
        threadId: options.threadId,
        userId: options.userId ?? null,
        model: agent.model.getName?.() ?? "unknown",
        provider: "langchain",
        inputTokens: totalInput,
        outputTokens: totalOutput,
        totalTokens: totalInput + totalOutput,
        latencyMs: 0,
        estimatedCost: null,
      },
    });
  }

  return { content, messageId, usage: { inputTokens: totalInput, outputTokens: totalOutput } };
}

export interface StreamTextOptions extends GenerateTextOptions {
  onDelta?: (delta: string) => void;
}

export async function streamText(
  agentName: string,
  options: StreamTextOptions,
  prisma: AuraDb = db,
): Promise<{ content: string; messageId: string }> {
  const agent = agentRegistry.get(agentName);
  if (!agent) throw new Error(`Agent not found: ${agentName}`);

  await prisma.auraAgentMessage.create({
    data: { id: uuidv4(), threadId: options.threadId, role: "user", content: options.prompt },
  });

  const history = await getThreadMessages(options.threadId, { limit: 50 }, prisma);
  const messages: BaseMessage[] = [
    new SystemMessage(agent.systemPrompt),
    ...history.map((m) => {
      if (m.role === "user") return new HumanMessage(m.content);
      if (m.role === "assistant") return new AIMessage(m.content);
      return new HumanMessage(m.content);
    }),
  ];

  const messageId = uuidv4();
  let fullContent = "";

  const stream = await agent.model.stream(messages);
  for await (const chunk of stream) {
    const delta = typeof chunk.content === "string" ? chunk.content : "";
    if (delta) {
      fullContent += delta;
      options.onDelta?.(delta);
      void publishInvalidation({
        keys: [`__agent_stream:${options.threadId}:${messageId}:${delta}`],
      });
    }
  }

  void publishInvalidation({
    keys: [`__agent_stream_done:${options.threadId}:${messageId}`],
  });

  await prisma.auraAgentMessage.create({
    data: { id: messageId, threadId: options.threadId, role: "assistant", content: fullContent },
  });

  return { content: fullContent, messageId };
}

export async function getAgentUsage(
  opts: { userId?: string; agentName?: string; since?: Date } = {},
  prisma: AuraDb = db,
) {
  const where: Record<string, unknown> = {};
  if (opts.userId) where.userId = opts.userId;
  if (opts.agentName) where.agentName = opts.agentName;
  if (opts.since) where.createdAt = { gte: opts.since };

  const usage = await prisma.auraAIUsage.aggregate({
    where,
    _sum: { inputTokens: true, outputTokens: true, totalTokens: true },
    _count: true,
  });

  return {
    totalCalls: usage._count,
    inputTokens: usage._sum.inputTokens ?? 0,
    outputTokens: usage._sum.outputTokens ?? 0,
    totalTokens: usage._sum.totalTokens ?? 0,
  };
}
