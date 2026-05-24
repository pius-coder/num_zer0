"use client";

import { useRef } from "react";
import {
  useMutation as useTanStackMutation,
  useQuery as useTanStackQuery,
  useQueryClient,
  type UseMutationOptions,
  type UseMutationResult,
  type UseQueryOptions,
  type UseQueryResult,
} from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import type { OperationRef } from "@/aura/core/types";
import { toast } from "sonner";
import type { AuraClientManifest } from "@/aura/shared/manifest";
import type { AuraBump } from "@/aura/core/envelope";
import {
  callAuraOperationWithMeta,
  fetchManifest,
  AuraClientError,
} from "./transport";
import { useBroadcast } from "./provider";
import { getOperationEntities } from "./manifest-cache";
import { auraQueryKey, type AuraQueryKey } from "@/aura/shared/query-key";

export { auraQueryKey };
export type { AuraQueryKey };

function resolveOperationName(ref: string | OperationRef): string {
  return typeof ref === "string" ? ref : ref._name;
}

function displayAuraBumps(bumps: AuraBump[]): void {
  for (const bump of bumps) {
    switch (bump.variant) {
      case "success":
        toast.success(bump.title, { description: bump.description });
        break;
      case "info":
        toast.info(bump.title, { description: bump.description });
        break;
      case "warning":
        toast.warning(bump.title, { description: bump.description });
        break;
      case "error":
        toast.error(bump.title, { description: bump.description });
        break;
    }
  }
}

type NarrowOperationRef<T> = T extends OperationRef<infer _TType, infer TInput, infer TOutput>
  ? { input?: TInput; data: TOutput }
  : { input?: unknown; data: unknown };

export interface UseQueryOptions_<TData> extends Omit<
  UseQueryOptions<TData, Error, TData, AuraQueryKey>,
  "queryKey" | "queryFn"
> {
  params?: unknown;
  showBumps?: boolean;
}

export function useQuery<TRef extends OperationRef>(
  operationRef: TRef,
  input?: NarrowOperationRef<TRef>["input"],
  options?: UseQueryOptions_<NarrowOperationRef<TRef>["data"]>,
): UseQueryResult<NarrowOperationRef<TRef>["data"], Error>;
export function useQuery<TData = unknown>(
  operationName: string,
  input?: unknown,
  options?: UseQueryOptions_<TData>,
): UseQueryResult<TData, Error>;
export function useQuery(
  operationRef: string | OperationRef,
  input?: unknown,
  options: UseQueryOptions_<unknown> = {},
) {
  const operationName = resolveOperationName(operationRef);
  const { params, showBumps = true, ...queryOptions } = options;
  const entities = getOperationEntities(operationName);

  return useTanStackQuery({
    ...(queryOptions as UseQueryOptions<unknown, Error, unknown, AuraQueryKey>),
    queryKey: auraQueryKey(operationName, input, params),
    queryFn: async ({ signal }) => {
      const result = await callAuraOperationWithMeta({
        operationName,
        input,
        params,
        signal,
      });
      if (showBumps) displayAuraBumps(result.meta.bumps);
      return result.data;
    },
    meta: { entities },
  });
}

export interface UseMutationOptions_<TInput, TData> extends Omit<
  UseMutationOptions<TData, Error, TInput>,
  "mutationFn"
> {
  params?: unknown;
  invalidate?: string[];
  refresh?: boolean;
  showBumps?: boolean;
}

interface CallableMutation<TInput, TData> {
  (input: TInput): Promise<TData>;
  mutate: UseMutationResult<TData, Error, TInput>["mutate"];
  mutateAsync: UseMutationResult<TData, Error, TInput>["mutateAsync"];
  isPending: boolean;
  isIdle: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: Error | null;
  data: TData | undefined;
  status: "idle" | "pending" | "success" | "error";
  reset: () => void;
}

export function useMutation<TRef extends OperationRef<"mutate" | "action">>(
  operationRef: TRef,
  options?: UseMutationOptions_<
    NarrowOperationRef<TRef>["input"],
    NarrowOperationRef<TRef>["data"]
  >,
): CallableMutation<
  NarrowOperationRef<TRef>["input"],
  NarrowOperationRef<TRef>["data"]
>;
export function useMutation<TInput = void, TData = unknown>(
  operationName: string,
  options?: UseMutationOptions_<TInput, TData>,
): CallableMutation<TInput, TData>;
export function useMutation(
  operationRef: string | OperationRef,
  options: UseMutationOptions_<unknown, unknown> = {},
) {
  const operationName = resolveOperationName(operationRef);
  const router = useRouter();
  const queryClient = useQueryClient();
  const broadcast = useBroadcast();
  const {
    params,
    invalidate,
    refresh = true,
    showBumps = true,
    onSuccess,
    onError: userOnError,
    ...mutationOptions
  } = options;

  const lastMetaRef = useRef<{
    invalidates: string[];
    refresh: boolean;
  } | null>(null);

  const mutation = useTanStackMutation({
    mutationFn: async (input: unknown) => {
      const result = await callAuraOperationWithMeta<unknown>({
        operationName,
        input,
        params,
      });
      if (showBumps) displayAuraBumps(result.meta.bumps);
      lastMetaRef.current = {
        invalidates: result.meta.invalidates,
        refresh: result.meta.refresh,
      };
      return result.data;
    },
    async onSuccess(data, variables, onMutateResult, context) {
      const meta = lastMetaRef.current;
      const explicitKeys = invalidate?.length ? invalidate : [];
      const entityKeys = meta?.invalidates?.length ? meta.invalidates : [];
      const allKeys = [...new Set([...explicitKeys, ...entityKeys])];
      if (allKeys.length === 0) allKeys.push(operationName);

      await queryClient.invalidateQueries({
        predicate: (query) => {
          const queryName = query.queryKey[1] as string;
          const metaEntities = (query.meta?.entities as string[]) || [];
          const manifestEntities = getOperationEntities(queryName);
          const queryEntities = [
            ...new Set([...metaEntities, ...manifestEntities]),
          ];
          return allKeys.some(
            (key) => key === queryName || queryEntities.includes(key),
          );
        },
      });

      const broadcastKeys = [...new Set([...entityKeys, operationName])];
      broadcast(broadcastKeys);

      if (refresh && meta?.refresh) router.invalidate();
      await onSuccess?.(data, variables, onMutateResult, context);
    },
    onError(error, variables, onMutateResult, context) {
      if (showBumps) {
        const isFieldError =
          error instanceof AuraClientError &&
          error.fieldErrors &&
          Object.keys(error.fieldErrors).length > 0;

        if (!isFieldError) {
          toast.error(error.message || "Une erreur est survenue");
        }
      }
      userOnError?.(error, variables, onMutateResult, context);
    },
    ...mutationOptions,
  });

  const callable = (input: unknown) => mutation.mutateAsync(input);

  Object.defineProperties(callable, {
    mutate: { get: () => mutation.mutate },
    mutateAsync: { get: () => mutation.mutateAsync },
    isPending: { get: () => mutation.isPending },
    isIdle: { get: () => mutation.isIdle },
    isSuccess: { get: () => mutation.isSuccess },
    isError: { get: () => mutation.isError },
    error: { get: () => mutation.error },
    data: { get: () => mutation.data },
    status: { get: () => mutation.status },
    reset: { get: () => mutation.reset },
  });

  return callable;
}

export function useAuraManifest() {
  return useTanStackQuery({
    queryKey: ["aura", "_manifest"],
    queryFn: ({ signal }) => fetchManifest<AuraClientManifest>(signal),
    staleTime: 5 * 60_000,
  });
}

export const useAuraQuery = useQuery;
export const useAuraMutation = useMutation;
