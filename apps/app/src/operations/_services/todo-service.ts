import { AuraService } from "@/aura/server/service";
import { AuraError } from "@/aura/core/errors";

export class TodoService extends AuraService {
  private requireUser() {
    if (!this.user) throw new AuraError("UNAUTHORIZED", "Authentification requise.");
    return this.user;
  }

  private async requireOwnership(id: string) {
    const user = this.requireUser();
    const existing = await this.db.todo.findUnique({ where: { id } });
    if (!existing) throw new AuraError("NOT_FOUND", "Tâche introuvable.");
    if (existing.userId !== user.id) throw new AuraError("FORBIDDEN", "Accès refusé.");
    return existing;
  }

  async list(input: {
    statuses?: ("PENDING" | "IN_PROGRESS" | "DONE")[];
    priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
    cursor?: string | null;
    numItems: number;
    search?: string;
  }) {
    const user = this.requireUser();
    return this.paginate(this.db.todo, {
      where: {
        userId: user.id,
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
    const user = this.requireUser();
    const todo = await this.db.todo.create({
      data: {
        title: input.title,
        description: input.description,
        priority: input.priority,
        dueDate: input.dueDate ? new Date(input.dueDate) : null,
        userId: user.id,
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
    await this.requireOwnership(id);

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
    await this.requireOwnership(input.id);
    await this.db.todo.delete({ where: { id: input.id } });
    this.bump.success("Tâche supprimée");
    return { ok: true };
  }

  async toggle(input: { id: string }) {
    const existing = await this.requireOwnership(input.id);
    const next = existing.status === "DONE" ? "PENDING" : "DONE";
    return this.db.todo.update({ where: { id: input.id }, data: { status: next } });
  }

}
