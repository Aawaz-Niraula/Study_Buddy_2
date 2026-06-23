"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Palette, HelpCircle, X } from "lucide-react";
import { useMascot } from "@/lib/mascot/MascotContext";
import { Aawax } from "@/components/mascot/Aawax";
import { MASCOT_NAME } from "@/lib/mascot/config";

export function AppHeader() {
  const { design, color, openDressUp, playBoop } = useMascot();
  const [helpOpen, setHelpOpen] = useState(false);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40 border-b border-white/[0.06] bg-[#06060b]/80 backdrop-blur-xl lg:hidden">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
          {/* Left: mascot + app name */}
          <button
            onClick={openDressUp}
            className="flex items-center gap-2.5 cursor-pointer"
            aria-label={`Customise ${MASCOT_NAME}`}
          >
            <span
              className="flex h-9 w-9 items-center justify-center rounded-full"
              style={{
                background: "rgba(var(--accent-glow), 0.12)",
                boxShadow: "0 0 14px rgba(var(--accent-glow), 0.25)",
              }}
            >
              <Aawax design={design} color={color} mood="idle" size={30} float={false} />
            </span>
            <span className="font-serif text-lg leading-none text-white">{MASCOT_NAME}</span>
          </button>

          {/* Right: actions */}
          <div className="flex items-center gap-2">
            <IconButton label="Customise" onClick={openDressUp}>
              <Palette className="h-[18px] w-[18px]" />
            </IconButton>
            <IconButton
              label="Help"
              onClick={() => {
                setHelpOpen(true);
                playBoop();
              }}
            >
              <HelpCircle className="h-[18px] w-[18px]" />
            </IconButton>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {helpOpen && (
          <motion.div
            className="fixed inset-0 z-[55] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setHelpOpen(false)} />
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
                <Aawax design={design} color={color} mood="think" size={120} glow interactive onBoop={playBoop} />
              </div>
              <h3 className="mt-2 font-serif text-xl text-white">Hi, I&apos;m {MASCOT_NAME}!</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/60">
                Paste notes or upload a PDF/photo on <b className="text-white/80">Generate</b> to make study
                questions. Take quizzes in <b className="text-white/80">Tests</b>, revisit past work in{" "}
                <b className="text-white/80">History</b>, and watch your scores climb in{" "}
                <b className="text-white/80">Progress</b>. Tap the palette to dress me up!
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function IconButton({
  children,
  label,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-white/70 transition-colors hover:bg-white/10 hover:text-white cursor-pointer"
    >
      {children}
    </button>
  );
}
