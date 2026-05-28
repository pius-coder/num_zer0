import { defineOperationFn } from "@/aura/server/operation";
import { z } from "zod";
import { TodoService } from "@/operations/_services/todo-service";

export default defineOperationFn("todos.toggle")
  .mutate()
  .input(z.object({ id: z.string() }))
  .auth()
  .handler(async ({ ctx, input }) => {
    return new TodoService(ctx).toggle(input);
  });
