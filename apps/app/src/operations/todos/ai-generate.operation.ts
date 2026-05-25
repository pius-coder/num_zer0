import { defineOperationFn } from "@/aura/server/operation";
import { z } from "zod";
import { TodoService } from "@/operations/_services/todo-service";

export default defineOperationFn("todos.ai-generate")
  .action()
  .input(
    z.object({
      goal: z.string().min(1).max(500),
      count: z.number().int().min(1).max(20).default(5),
    }),
  )
  .entities(["Todo"])
  .public()
  .handler(async ({ ctx, input }) => {
    return new TodoService(ctx).aiGenerate(input);
  });
