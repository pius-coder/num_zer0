import { AuraService } from "@/aura/server/service";
import { AuraError } from "@/aura/core/errors";

export class TodoService extends AuraService {
  async list(input: {
    statuses?: ("PENDING" | "IN_PROGRESS" | "DONE")[];
    priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
    cursor?: string | null;
    numItems: number;
    search?: string;
  }) {
    return this.paginate(this.db.todo, {
      where: {
        ...(input.statuses?.length && { status: { in: input.statuses } }),
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
  }) {
    const todo = await this.db.todo.create({
      data: {
        title: input.title,
        description: input.description,
        priority: input.priority,
        dueDate: input.dueDate ? new Date(input.dueDate) : null,
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

}
