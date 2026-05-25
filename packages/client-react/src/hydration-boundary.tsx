"use client";

import { HydrationBoundary, type HydrationBoundaryProps } from "@tanstack/react-query";

export function AuraHydrationBoundary(props: HydrationBoundaryProps) {
  return <HydrationBoundary {...props} />;
}
