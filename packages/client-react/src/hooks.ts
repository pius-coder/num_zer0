"use client";

import {
  useQuery as useTanStackQuery,
  useMutation as useTanStackMutation,
  type UseQueryOptions,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { callAura, AuraClientError } from "./transport";

type OperationRef = { _name: string; _type: "query" | "mutate" | "action" };
type InferInput<T> = T extends { _input?: infer I } ? I : never;
type InferOutput<T> = T extends { _output?: infer O } ? O : never;

export function auraQueryKey(ref: { _name: string }, input?: unknown): [string, unknown?] {
  return input !== undefined ? [ref._name, input] : [ref._name];
}

export function useQuery<TRef extends OperationRef & { _type: "query" }>(
  ref: TRef,
  input: InferInput<TRef>,
  options?: Omit<UseQueryOptions<InferOutput<TRef>>, "queryKey" | "queryFn">,
) {
  return useTanStackQuery<InferOutput<TRef>>({
    queryKey: auraQueryKey(ref, input),
    queryFn: async () => {
      const envelope = await callAura<InferOutput<TRef>>(ref._name, input);
      if (!envelope.ok) throw new AuraClientError(envelope);
      return envelope.data;
    },
    ...options,
  });
}

export function useMutation<TRef extends OperationRef & { _type: "mutate" | "action" }>(
  ref: TRef,
  options?: Omit<
    UseMutationOptions<InferOutput<TRef>, AuraClientError, InferInput<TRef>>,
    "mutationFn"
  >,
) {
  return useTanStackMutation<InferOutput<TRef>, AuraClientError, InferInput<TRef>>({
    mutationFn: async (input) => {
      const envelope = await callAura<InferOutput<TRef>>(ref._name, input);
      if (!envelope.ok) throw new AuraClientError(envelope);
      return envelope.data;
    },
    ...options,
  });
}
