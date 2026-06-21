"use client";

import { usePathname } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { AppHeader } from "./AppHeader";
import { BottomTabBar } from "./BottomTabBar";
import { FloatingMascot } from "./FloatingMascot";
import { DressUpRoom } from "@/components/mascot/DressUpRoom";
import { ChatWithAawax } from "@/components/mascot/ChatWithAawax";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const reduce = useReducedMotion();

  return (
    <div className="relative min-h-screen text-white">
      {/* Ambient accent glow blobs bleeding in from the corners */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div
          className="absolute -top-32 -left-24 h-80 w-80 rounded-full blur-3xl"
          style={{ background: "rgba(var(--accent-glow), 0.16)" }}
        />
        <div
          className="absolute -bottom-40 -right-24 h-96 w-96 rounded-full blur-3xl"
          style={{ background: "rgba(var(--accent-glow), 0.12)" }}
        />
      </div>

      <AppHeader />

      <main className="mx-auto max-w-2xl px-4 pb-28 pt-[72px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduce ? undefined : { opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      <FloatingMascot />
      <BottomTabBar />
      <DressUpRoom />
      <ChatWithAawax />
    </div>
  );
}
