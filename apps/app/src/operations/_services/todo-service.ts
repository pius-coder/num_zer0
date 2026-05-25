import { AuraService } from "@/aura/server/service";
import { AuraError } from "@/aura/core/errors";
import todoPlannerAgent from "@/operations/ai/todo-planner.agent";
import { z } from "zod";

const ResponseSchema = z.object({
  todos: z.array(
    z.object({
      title: z.string(),
      description: z.string().optional(),
      priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
    }),
  ),
});

export class TodoService extends AuraService {
  async list(input: {
    status?: "PENDING" | "IN_PROGRESS" | "DONE";
    priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
    cursor?: string | null;
    numItems: number;
    search?: string;
  }) {
    return this.paginate(this.db.todo, {
      where: {
        ...(input.status && { status: input.status }),
        ...(input.priority && { priority: input.priority }),
        ...(input.search && {
          OR: [
            { title: { contains: input.search, mode: "insensitive" as const } },
            { description: { contains: input.search, mode: "insensitive" as const } },
          ],
        }),
      },
      cursor: input.cursor ?? undefined,
      take: input.numItems,
      orderBy: "createdAt",
      direction: "desc",
      operationHash: "todos.list",
    });
  }

  async create(input: {
    title: string;
    description?: string;
    priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
    dueDate?: string;
    aiGenerated: boolean;
  }) {
    const todo = await this.db.todo.create({
      data: {
        title: input.title,
        description: input.description,
        priority: input.priority,
        dueDate: input.dueDate ? new Date(input.dueDate) : null,
        aiGenerated: input.aiGenerated,
      },
    });
    this.bump.success("Tâche créée", todo.title);
    return todo;
  }

  async update(input: {
    id: string;
    title?: string;
    description?: string | null;
    status?: "PENDING" | "IN_PROGRESS" | "DONE";
    priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
    dueDate?: string | null;
  }) {
    const { id, dueDate, ...rest } = input;
    const existing = await this.db.todo.findUnique({ where: { id } });
    if (!existing) throw new AuraError("NOT_FOUND", "Tâche introuvable.");

    const todo = await this.db.todo.update({
      where: { id },
      data: {
        ...rest,
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
      },
    });

    this.invalidate({ entity: "Todo", id });
    this.bump.success("Tâche mise à jour", todo.title);
    return todo;
  }

  async delete(input: { id: string }) {
    await this.db.todo.delete({ where: { id: input.id } });
    this.bump.success("Tâche supprimée");
    return { ok: true };
  }

  async toggle(input: { id: string }) {
    const existing = await this.db.todo.findUnique({ where: { id: input.id } });
    if (!existing) return { ok: false };
    const next = existing.status === "DONE" ? "PENDING" : "DONE";
    return this.db.todo.update({ where: { id: input.id }, data: { status: next } });
  }

  async aiGenerate(input: { goal: string; count: number }) {
    if (!process.env.OPENROUTER_API_KEY) {
      throw new AuraError("INTERNAL_ERROR", "OPENROUTER_API_KEY n'est pas défini.");
    }

    const thread = await this.agent.createThread(todoPlannerAgent, {
      userId: this.user?.id,
      metadata: { source: "todos.ai-generate", goal: input.goal },
    });

    const response = await this.agent.generateText(thread, {
      prompt: `Objectif: ${input.goal}\n\nGénère exactement ${input.count} tâches.`,
    });

    const match = response.content.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new AuraError("INTERNAL_ERROR", "Réponse de l'agent invalide (JSON manquant).");
    }
    const parsed = ResponseSchema.safeParse(JSON.parse(match[0]));
    if (!parsed.success) {
      throw new AuraError("INTERNAL_ERROR", `Réponse de l'agent invalide: ${parsed.error.message}`);
    }

    const created = [];
    for (const t of parsed.data.todos) {
      const todo = await this.runMutation("todos.create", {
        title: t.title,
        description: t.description,
        priority: t.priority,
        aiGenerated: true,
      });
      created.push(todo);
    }

    this.bump.success(
      "Tâches générées",
      `${created.length} tâche(s) créée(s) à partir de votre objectif.`,
    );

    return { count: created.length, todos: created };
  }
}
