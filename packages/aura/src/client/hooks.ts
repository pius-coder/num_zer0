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

// ---------------------------------------------------------------------------
// useMutation — options-based API
// ---------------------------------------------------------------------------

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
  failureCount: number;
  failureReason: Error | null;
  variables: TInput | undefined;
  submittedAt: Date | undefined;
}

export interface UseMutationBuilder<TInput, TData, TContext = unknown> {
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
  failureCount: number;
  failureReason: Error | null;
  variables: TInput | undefined;
  submittedAt: Date | undefined;

  onMutate<TNewContext>(
    fn: (vars: TInput) => TNewContext | Promise<TNewContext>,
  ): UseMutationBuilder<TInput, TData, TNewContext>;
  onSuccess(
    fn: (data: TData, vars: TInput, ctx: TContext) => void,
  ): UseMutationBuilder<TInput, TData, TContext>;
  onError(
    fn: (err: Error, vars: TInput, ctx: TContext) => void,
  ): UseMutationBuilder<TInput, TData, TContext>;
  onSettled(
    fn: (data: TData | undefined, err: Error | null, vars: TInput, ctx: TContext) => void,
  ): UseMutationBuilder<TInput, TData, TContext>;
}

// Overloads — Order matters: builder (1 arg) before options (2 args).
// useMutation(ref)          → builder
// useMutation(ref, opts)    → callable (options path)

export function useMutation<TRef extends OperationRef<"mutate" | "action">>(
  operationRef: TRef,
): UseMutationBuilder<
  NarrowOperationRef<TRef>["input"],
  NarrowOperationRef<TRef>["data"]
>;

export function useMutation<TRef extends OperationRef<"mutate" | "action">>(
  operationRef: TRef,
  options: UseMutationOptions_<
    NarrowOperationRef<TRef>["input"],
    NarrowOperationRef<TRef>["data"]
  >,
): CallableMutation<
  NarrowOperationRef<TRef>["input"],
  NarrowOperationRef<TRef>["data"]
>;

export function useMutation<TInput = void, TData = unknown>(
  operationName: string,
): UseMutationBuilder<TInput, TData>;

export function useMutation<TInput = void, TData = unknown>(
  operationName: string,
  options: UseMutationOptions_<TInput, TData>,
): CallableMutation<TInput, TData>;

export function useMutation(
  operationRef: string | OperationRef,
  options?: UseMutationOptions_<unknown, unknown>,
) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const operationName = resolveOperationName(operationRef);

  // Shared state across both paths
  const lastMetaRef = useRef<{
    invalidates: string[];
    refresh: boolean;
  } | null>(null);

  // Builder path: callbacks are stored in a ref and set via builder methods
  // Options path: callbacks are captured from the options object immediately
  const callbacksRef = useRef<{
    onMutate: ((vars: unknown) => unknown) | undefined;
    onSuccess: ((data: unknown, vars: unknown, ctx: unknown) => void) | undefined;
    onError: ((err: Error, vars: unknown, ctx: unknown) => void) | undefined;
    onSettled: ((data: unknown, err: Error | null, vars: unknown, ctx: unknown) => void) | undefined;
    invalidate: string[] | undefined;
    params: unknown;
    refresh: boolean;
    showBumps: boolean;
  }>({
    onMutate: undefined,
    onSuccess: undefined,
    onError: undefined,
    onSettled: undefined,
    invalidate: undefined,
    params: undefined,
    refresh: true,
    showBumps: true,
  });

  // Populate callbacks ref from options when provided.
  // All Aura-specific fields are destructured; remaining keys
  // (retry, gcTime, networkMode, mutationKey, etc.) are forwarded
  // to TanStack Query via tanstackOptionsRef.
  const tanstackOptionsRef = useRef<Record<string, unknown>>({});
  if (options !== undefined) {
    const {
      params,
      invalidate,
      refresh = true,
      showBumps = true,
      onMutate,
      onSuccess,
      onError,
      onSettled,
      ...tanstackOptions
    } = options;
    callbacksRef.current.onMutate = onMutate as (vars: unknown) => unknown;
    callbacksRef.current.onSuccess = onSuccess as (data: unknown, vars: unknown, ctx: unknown) => void;
    callbacksRef.current.onError = onError as (err: Error, vars: unknown, ctx: unknown) => void;
    callbacksRef.current.onSettled = onSettled as (data: unknown, err: Error | null, vars: unknown, ctx: unknown) => void;
    callbacksRef.current.invalidate = invalidate;
    callbacksRef.current.params = params;
    callbacksRef.current.refresh = refresh;
    callbacksRef.current.showBumps = showBumps;
    tanstackOptionsRef.current = tanstackOptions as Record<string, unknown>;
  }

  const mutation = useTanStackMutation({
    mutationFn: async (input: unknown) => {
      const result = await callAuraOperationWithMeta<unknown>({
        operationName,
        input,
        params: callbacksRef.current.params,
      });
      if (callbacksRef.current.showBumps) displayAuraBumps(result.meta.bumps);
      lastMetaRef.current = {
        invalidates: result.meta.invalidates,
        refresh: result.meta.refresh,
      };
      return result.data;
    },
    onMutate(variables: unknown) {
      return callbacksRef.current.onMutate?.(variables) as unknown;
    },
    async onSuccess(data: unknown, variables: unknown, context: unknown) {
      const meta = lastMetaRef.current;
      const explicitKeys = callbacksRef.current.invalidate?.length ? callbacksRef.current.invalidate : [];
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

      if (typeof BroadcastChannel !== "undefined") {
        try {
          const bc = new BroadcastChannel("aura:realtime");
          bc.postMessage({ id: crypto.randomUUID(), keys: allKeys });
          bc.close();
        } catch { /* ignore */ }
      }

      if (callbacksRef.current.refresh && meta?.refresh) router.invalidate();
      await callbacksRef.current.onSuccess?.(data, variables, context);
    },
    onError(error: Error, variables: unknown, context: unknown) {
      if (callbacksRef.current.showBumps) {
        const isFieldError =
          error instanceof AuraClientError &&
          error.fieldErrors &&
          Object.keys(error.fieldErrors).length > 0;

        if (!isFieldError) {
          toast.error(error.message || "Une erreur est survenue");
        }
      }
      callbacksRef.current.onError?.(error, variables, context);
    },
    onSettled(data: unknown, error: Error | null, variables: unknown, context: unknown) {
      callbacksRef.current.onSettled?.(data, error, variables, context);
    },
    ...(tanstackOptionsRef.current as UseMutationOptions<unknown, Error, unknown, unknown>),
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
    failureCount: { get: () => mutation.failureCount },
    failureReason: { get: () => mutation.failureReason },
    variables: { get: () => mutation.variables },
    submittedAt: { get: () => mutation.submittedAt },
  });

  // Builder path: attach chainable methods
  if (options === undefined) {
    Object.defineProperties(callable, {
      onMutate: {
        value: (fn: (vars: unknown) => unknown) => {
          callbacksRef.current.onMutate = fn;
          return callable;
        },
      },
      onSuccess: {
        value: (fn: (data: unknown, vars: unknown, ctx: unknown) => void) => {
          callbacksRef.current.onSuccess = fn;
          return callable;
        },
      },
      onError: {
        value: (fn: (err: Error, vars: unknown, ctx: unknown) => void) => {
          callbacksRef.current.onError = fn;
          return callable;
        },
      },
      onSettled: {
        value: (fn: (data: unknown, err: Error | null, vars: unknown, ctx: unknown) => void) => {
          callbacksRef.current.onSettled = fn;
          return callable;
        },
      },
    });
  }

  return callable;
}

// ---------------------------------------------------------------------------
// useAuraManifest
// ---------------------------------------------------------------------------

export function useAuraManifest() {
  return useTanStackQuery({
    queryKey: ["aura", "_manifest"],
    queryFn: ({ signal }) => fetchManifest<AuraClientManifest>(signal),
    staleTime: 5 * 60_000,
  });
}

export const useAuraQuery = useQuery;
export const useAuraMutation = useMutation;
