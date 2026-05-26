import { defineOperationFn } from "@/aura/server/operation";
import { z } from "zod";
import { TodoService } from "@/operations/_services/todo-service";

export default defineOperationFn("todos.list")
  .query()
  .input(
    z.object({
      statuses: z.array(z.enum(["PENDING", "IN_PROGRESS", "DONE"])).optional(),
      priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
      cursor: z.string().nullish(),
      numItems: z.number().int().positive().max(100).default(20),
      search: z.string().optional(),
    }),
  )
  .entities(["Todo"])
  .public()
  .handler(async ({ ctx, input }) => {
    return new TodoService(ctx).list(input);
  });
