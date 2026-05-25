import { defineOperationFn } from "@/aura/server/operation";
import { z } from "zod";
import { TodoService } from "@/operations/_services/todo-service";

export default defineOperationFn("todos.update")
  .mutate()
  .input(
    z.object({
      id: z.string(),
      title: z.string().min(1).max(200).optional(),
      description: z.string().max(2000).nullish(),
      status: z.enum(["PENDING", "IN_PROGRESS", "DONE"]).optional(),
      priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
      dueDate: z.string().datetime().nullish(),
    }),
  )
  .entities(["Todo"])
  .public()
  .handler(async ({ ctx, input }) => {
    return new TodoService(ctx).update(input);
  });
