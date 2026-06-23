"use client";

import { motion } from "framer-motion";
import { useMascot } from "@/lib/mascot/MascotContext";
import { Aawax } from "@/components/mascot/Aawax";

/** A persistent little companion that floats above the tab bar and opens
 *  the chat with Aawax when tapped. */
export function FloatingMascot() {
  const { design, color, mood, openChat, playBoop } = useMascot();

  return (
    <motion.button
      onClick={() => {
        playBoop();
        openChat();
      }}
      aria-label="Chat with Aawax"
      className="fixed bottom-[84px] right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-[#0d0d15]/80 backdrop-blur-md cursor-pointer lg:bottom-6 lg:right-6"
      style={{ boxShadow: "0 6px 24px rgba(var(--accent-glow), 0.35)" }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", damping: 18, stiffness: 260, delay: 0.3 }}
      whileTap={{ scale: 0.9 }}
    >
      <Aawax design={design} color={color} mood={mood} size={46} float />
    </motion.button>
  );
}
