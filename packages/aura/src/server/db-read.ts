import type { z } from "zod";
import { db } from "./db";
import type { AuraDb } from "./db";
import { AuraError } from "@/aura/core/errors";

export interface DbReadFn<TInput, TOutput> {
  readonly __auraDbRead: true;
  readonly name: string;
  (input: TInput): Promise<TOutput>;
}

export function defineDbReadFn<TInputSchema extends z.ZodType, TOutputSchema extends z.ZodType>(
  name: string,
): {
  input(schema: TInputSchema): {
    output(schema: TOutputSchema): {
      handler(
        handler: (args: { db: AuraDb; input: z.infer<TInputSchema> }) => Promise<unknown>,
      ): DbReadFn<z.infer<TInputSchema>, z.infer<TOutputSchema>>;
    };
  };
} {
  const state: { inputSchema: TInputSchema | null; outputSchema: TOutputSchema | null } = {
    inputSchema: null,
    outputSchema: null,
  };

  return {
    input(schema) {
      state.inputSchema = schema;
      return {
        output(schema) {
          state.outputSchema = schema as TOutputSchema;
          return {
            handler(handler) {
              type TInput = z.infer<TInputSchema>;
              type TOutput = z.infer<TOutputSchema>;
              const inputSchema = state.inputSchema!;
              const outputSchema = state.outputSchema!;

              const fn = (async (input: TInput): Promise<TOutput> => {
                const parsedInput = inputSchema.safeParse(input);
                if (!parsedInput.success) {
                  throw new AuraError("VALIDATION_ERROR", `Input invalide pour ${name}`);
                }
                const raw = await handler({ db, input: parsedInput.data });
                const parsedOutput = outputSchema.safeParse(raw);
                if (!parsedOutput.success) {
                  throw new AuraError(
                    "INTERNAL_ERROR",
                    `Sortie invalide pour ${name}: la vue retourne une forme inattendue.`,
                  );
                }
                return parsedOutput.data as TOutput;
              }) as DbReadFn<TInput, TOutput>;

              Object.assign(fn, { __auraDbRead: true as const, name });
              return fn;
            },
          };
        },
      };
    },
  };
}
