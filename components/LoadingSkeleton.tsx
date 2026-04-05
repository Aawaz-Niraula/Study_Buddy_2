"use client";

import { motion } from "framer-motion";

export function LoadingSkeleton() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#06060b] via-[#0b0b12] to-[#11111a] text-[#f2efff]">
      {/* Top bar skeleton */}
      <div className="fixed top-0 left-0 right-0 z-30 px-4 py-3 bg-gradient-to-b from-[#06060b] to-transparent">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="h-4 w-24 bg-white/5 rounded-md animate-pulse" />
          <div className="flex items-center gap-2">
            <div className="h-8 w-14 bg-white/5 rounded-xl animate-pulse" />
            <div className="h-8 w-14 bg-white/5 rounded-xl animate-pulse" />
            <div className="h-8 w-14 bg-white/5 rounded-xl animate-pulse" />
            <div className="h-8 w-8 bg-white/5 rounded-full animate-pulse" />
          </div>
        </div>
      </div>

      {/* Content skeleton */}
      <div className="pt-20 px-4 pb-24 max-w-3xl mx-auto">
        {/* Brand pill */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="flex items-center justify-between mb-6"
        >
          <div className="h-6 w-32 bg-white/5 rounded-full animate-pulse" />
          <div className="h-8 w-28 bg-white/5 rounded-xl animate-pulse" />
        </motion.div>

        {/* Title skeleton */}
        <div className="text-center mb-8">
          <div className="h-10 w-64 mx-auto bg-white/5 rounded-lg animate-pulse mb-3" />
          <div className="h-4 w-48 mx-auto bg-white/5 rounded-md animate-pulse" />
        </div>

        {/* Input card skeleton */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-4"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-white/5 animate-pulse" />
            <div className="h-4 w-12 bg-white/5 rounded-md animate-pulse" />
          </div>
          <div className="h-28 bg-[#11111a] rounded-xl animate-pulse mb-4" />
          <div className="flex gap-3">
            <div className="flex-1 h-12 bg-white/5 rounded-full animate-pulse" />
            <div className="flex-1 h-12 bg-white/5 rounded-full animate-pulse" />
          </div>
        </motion.div>

        {/* Options card skeleton */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/5 animate-pulse" />
            <div className="h-4 w-16 bg-white/5 rounded-md animate-pulse" />
          </div>
        </motion.div>

        {/* Button skeleton */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="h-14 bg-white/5 rounded-2xl animate-pulse"
        />
      </div>
    </main>
  );
}
