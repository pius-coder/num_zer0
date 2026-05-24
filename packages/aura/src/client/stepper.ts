import { useCallback, useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useForm,
  type FieldValues,
  type Path,
  type Resolver,
} from "react-hook-form";
import type { z } from "zod";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { useMutation, type UseMutationOptions_ as UseMutationOpts } from "./hooks";
import { AuraClientError } from "./transport";

interface StepperStoreState<TData extends FieldValues> {
  step: number;
  values: Partial<TData>;
  completedSteps: number[];
  setStep: (step: number) => void;
  setValues: (values: Partial<TData>) => void;
  markStepCompleted: (step: number) => void;
  reset: () => void;
}

function createStepperStore<TData extends FieldValues>(key: string) {
  return create<StepperStoreState<TData>>()(persist((set) => ({
    step: 0,
    values: {} as Partial<TData>,
    completedSteps: [],
    setStep: (step) => set({ step }),
    setValues: (values) => set((state) => ({ values: { ...state.values, ...values } })),
    markStepCompleted: (step) => set((state) => ({
      completedSteps: state.completedSteps.includes(step)
        ? state.completedSteps
        : [...state.completedSteps, step],
    })),
    reset: () => set({ step: 0, values: {} as Partial<TData>, completedSteps: [] }),
  }), {
    name: `aura-stepper-${key}`,
    storage: createJSONStorage(() => localStorage),
    skipHydration: true,
  }));
}

export interface UseStepperFormOptions<
  TValues extends FieldValues,
  TData,
> {
  operationName: string;
  stepperKey: string;
  steps: Array<{
    name: string;
    schema: z.ZodType<TValues>;
    defaultValues?: Partial<TValues>;
  }>;
  mutation?: UseMutationOpts<TValues, TData>;
}

export function useStepperForm<TValues extends FieldValues, TData = unknown>(
  options: UseStepperFormOptions<TValues, TData>,
) {
  const { operationName, stepperKey, steps, mutation: mutationOptions } = options;
  const useStore = createStepperStore<TValues>(stepperKey);
  const step = useStore((s) => s.step);
  const values = useStore((s) => s.values);
  const completedSteps = useStore((s) => s.completedSteps);
  const setStep = useStore((s) => s.setStep);
  const setValues = useStore((s) => s.setValues);
  const markStepCompleted = useStore((s) => s.markStepCompleted);
  const resetStore = useStore((s) => s.reset);

  const isLastStep = step === steps.length - 1;
  const schema = steps[step]?.schema;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const form = useForm<TValues>({ resolver: schema ? (zodResolver(schema as any) as any) : undefined });
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => { setHydrated(true); }, []);

  const mutation = useMutation<TValues, TData>(operationName, {
    ...mutationOptions,
    onError(error, variables, onMutateResult, context) {
      if (error instanceof AuraClientError && error.fieldErrors) {
        applyServerFieldErrors(form.setError, error.fieldErrors);
      }
      mutationOptions?.onError?.(error, variables, onMutateResult, context);
    },
  });

  const goToStep = useCallback(
    (s: number) => {
      if (s < 0 || s >= steps.length) return;
      setStep(s);
    },
    [setStep, steps.length],
  );

  const nextStep = useCallback(
    async (formValues: TValues) => {
      setValues(formValues as Partial<TValues>);
      markStepCompleted(step);

      if (isLastStep) {
        const allValues = { ...values, ...formValues } as TValues;
        mutation.mutate(allValues);
        return;
      }

      setStep(step + 1);
    },
    [setValues, markStepCompleted, step, isLastStep, values, mutation, setStep],
  );

  const prevStep = useCallback(() => {
    if (step > 0) setStep(step - 1);
  }, [step, setStep]);

  const reset = useCallback(() => {
    resetStore();
    form.reset();
    mutation.reset();
  }, [resetStore, form, mutation]);

  return {
    form,
    mutation,
    step,
    steps,
    isLastStep,
    isFirstStep: step === 0,
    completedSteps,
    goToStep,
    nextStep,
    prevStep,
    reset,
    handleSubmit: form.handleSubmit(nextStep),
    hydrated: typeof window !== "undefined" && hydrated,
  };
}

function applyServerFieldErrors<TValues extends FieldValues>(
  setError: ReturnType<typeof useForm<TValues>>["setError"],
  fieldErrors: Record<string, string[]>,
): void {
  for (const [field, messages] of Object.entries(fieldErrors)) {
    setError(field as Path<TValues>, {
      type: "server",
      message: messages.join("\n"),
    });
  }
}
