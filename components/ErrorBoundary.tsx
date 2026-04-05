"use client";

import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback onReset={() => this.setState({ hasError: false, error: null })} />;
    }
    return this.props.children;
  }
}

function ErrorFallback({ onReset }: { onReset: () => void }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#06060b] via-[#0b0b12] to-[#11111a] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full text-center"
      >
        <div className="p-4 bg-red-500/10 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
          <AlertTriangle className="w-10 h-10 text-red-400" />
        </div>
        <h1 className="text-2xl font-bold text-[#f2efff] mb-3">
          Something went wrong
        </h1>
        <p className="text-[#857ca2] text-sm mb-8 leading-relaxed">
          An unexpected error occurred. Don&apos;t worry — your data is safe.
          Try reloading the page.
        </p>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            onReset();
            window.location.reload();
          }}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#a78bfa] to-[#f9a8d4] text-white font-medium rounded-xl shadow-lg"
        >
          <RefreshCw className="w-4 h-4" />
          Reload Page
        </motion.button>
      </motion.div>
    </div>
  );
}
