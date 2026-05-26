import { defineOperationFn } from "@/aura/server/operation";
import { z } from "zod";
import { TodoService } from "@/operations/_services/todo-service";

export default defineOperationFn("todos.create")
  .mutate()
  .input(
    z.object({
      title: z.string().min(1).max(200),
      description: z.string().max(2000).optional(),
      priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
      dueDate: z.string().datetime().optional(),
    }),
  )
  .entities(["Todo"])
  .auth()
  .handler(async ({ ctx, input }) => {
    return new TodoService(ctx).create(input);
  });
