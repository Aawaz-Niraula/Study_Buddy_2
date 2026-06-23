"use client";

import { usePathname } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { AppHeader } from "./AppHeader";
import { BottomTabBar } from "./BottomTabBar";
import { SideNav } from "./SideNav";
import { FloatingMascot } from "./FloatingMascot";
import { DressUpRoom } from "@/components/mascot/DressUpRoom";
import { ChatWithAawax } from "@/components/mascot/ChatWithAawax";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const reduce = useReducedMotion();

  return (
    <div className="relative min-h-screen text-white">
      {/* Ambient accent glow blobs */}
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

      {/* Desktop sidebar — hidden on mobile */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:flex lg:w-60 lg:flex-col lg:border-r lg:border-white/[0.06] lg:bg-[#06060b]/90 lg:backdrop-blur-xl">
        <SideNav />
      </aside>

      {/* Mobile-only top header */}
      <AppHeader />

      {/* Main content
          Mobile:  full-width, top padding for header, bottom padding for tab bar
          Desktop: left margin for sidebar, wider max-width, no bottom tab bar padding */}
      <main className="mx-auto max-w-2xl px-4 pb-28 pt-[72px] lg:mx-0 lg:ml-60 lg:max-w-none lg:px-10 lg:pb-12 lg:pt-10">
        <div className="lg:mx-auto lg:max-w-3xl">
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
        </div>
      </main>

      <FloatingMascot />
      {/* Bottom tab bar — mobile only */}
      <BottomTabBar />
      <DressUpRoom />
      <ChatWithAawax />
    </div>
  );
}
