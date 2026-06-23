"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  PencilLine,
  Clock,
  TrendingUp,
  User,
  Palette,
  HelpCircle,
  X,
  type LucideIcon,
} from "lucide-react";
import { useMascot } from "@/lib/mascot/MascotContext";
import { Aawax } from "@/components/mascot/Aawax";
import { MASCOT_NAME } from "@/lib/mascot/config";

type Tab = { href: string; label: string; icon: LucideIcon };

const TABS: Tab[] = [
  { href: "/", label: "Generate", icon: Sparkles },
  { href: "/tests", label: "Tests", icon: PencilLine },
  { href: "/history", label: "History", icon: Clock },
  { href: "/progress", label: "Progress", icon: TrendingUp },
  { href: "/account", label: "Account", icon: User },
];

export function SideNav() {
  const pathname = usePathname();
  const { design, color, openDressUp, openChat, playBoop } = useMascot();
  const [helpOpen, setHelpOpen] = useState(false);

  return (
    <>
      <div className="flex h-full flex-col px-3 py-5">
        {/* Branding */}
        <button
          onClick={openDressUp}
          className="mb-8 flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-white/5 cursor-pointer"
          aria-label={`Customise ${MASCOT_NAME}`}
        >
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
            style={{
              background: "rgba(var(--accent-glow), 0.12)",
              boxShadow: "0 0 14px rgba(var(--accent-glow), 0.25)",
            }}
          >
            <Aawax design={design} color={color} mood="idle" size={30} float={false} />
          </span>
          <span className="font-serif text-lg leading-none text-white">{MASCOT_NAME}</span>
        </button>

        {/* Nav links */}
        <nav className="flex-1 space-y-0.5">
          {TABS.map((tab) => {
            const active =
              tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
            const Icon = tab.icon;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className="relative flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors"
              >
                {active && (
                  <motion.span
                    layoutId="side-nav-pill"
                    className="absolute inset-0 rounded-xl"
                    style={{ background: "rgba(var(--accent-glow), 0.14)" }}
                    transition={{ type: "spring", damping: 26, stiffness: 320 }}
                  />
                )}
                <Icon
                  className="relative h-5 w-5 shrink-0 transition-colors"
                  style={{
                    color: active ? "var(--accent-soft)" : "rgba(255,255,255,0.4)",
                  }}
                />
                <span
                  className="relative text-sm font-medium transition-colors"
                  style={{
                    color: active ? "var(--accent-soft)" : "rgba(255,255,255,0.5)",
                  }}
                >
                  {tab.label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom actions */}
        <div className="space-y-0.5 border-t border-white/[0.06] pt-3">
          <button
            onClick={() => {
              playBoop();
              openChat();
            }}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-white/50 transition-colors hover:bg-white/5 hover:text-white/80 cursor-pointer"
          >
            <Aawax design={design} color={color} mood="idle" size={20} float={false} />
            <span className="text-sm font-medium">Chat with Aawax</span>
          </button>
          <button
            onClick={openDressUp}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-white/50 transition-colors hover:bg-white/5 hover:text-white/80 cursor-pointer"
          >
            <Palette className="h-5 w-5" />
            <span className="text-sm font-medium">Customise Aawax</span>
          </button>
          <button
            onClick={() => setHelpOpen(true)}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-white/50 transition-colors hover:bg-white/5 hover:text-white/80 cursor-pointer"
          >
            <HelpCircle className="h-5 w-5" />
            <span className="text-sm font-medium">Help</span>
          </button>
        </div>
      </div>

      {/* Help modal */}
      <AnimatePresence>
        {helpOpen && (
          <motion.div
            className="fixed inset-0 z-[55] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setHelpOpen(false)}
            />
            <motion.div
              className="relative w-full max-w-sm rounded-3xl border border-white/10 bg-[#0d0d15] p-6 text-center"
              initial={{ scale: 0.9, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", damping: 26, stiffness: 320 }}
            >
              <button
                onClick={() => setHelpOpen(false)}
                aria-label="Close"
                className="absolute right-4 top-4 text-white/50 hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
              <div className="flex justify-center">
                <Aawax
                  design={design}
                  color={color}
                  mood="think"
                  size={120}
                  glow
                  interactive
                  onBoop={playBoop}
                />
              </div>
              <h3 className="mt-2 font-serif text-xl text-white">
                Hi, I&apos;m {MASCOT_NAME}!
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-white/60">
                Paste notes or upload a PDF/photo on{" "}
                <b className="text-white/80">Generate</b> to make study questions. Take
                quizzes in <b className="text-white/80">Tests</b>, revisit past work in{" "}
                <b className="text-white/80">History</b>, and watch your scores climb in{" "}
                <b className="text-white/80">Progress</b>. Tap the palette to dress me
                up!
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
