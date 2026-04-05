"use client";

import { ErrorBoundary } from "@/components/ErrorBoundary";

export function ClientErrorBoundary({ children }: { children: React.ReactNode }) {
  return <ErrorBoundary>{children}</ErrorBoundary>;
}
