"use client";

import { motion } from "framer-motion";
import { Plus, FlaskConical, FileText } from "lucide-react";

type ButtonState = "new-session" | "take-test" | "see-results";

interface ContextAwareButtonProps {
  state: ButtonState;
  onClick: () => void;
}

export function ContextAwareButton({ state, onClick }: ContextAwareButtonProps) {
  const config = {
    "new-session": {
      text: "+ NEW SESSION",
      icon: Plus,
      glow: false,
    },
    "take-test": {
      text: "TAKE TEST",
      icon: FlaskConical,
      glow: false,
    },
    "see-results": {
      text: "SEE RESULTS",
      icon: FileText,
      glow: true,
    },
  };

  const { text, icon: Icon, glow } = config[state];

  return (
    <motion.button
      whileTap={{ opacity: 0.6 }}
      onClick={onClick}
      className={`inline-flex items-center gap-2 min-h-[48px] px-6 py-3 rounded-2xl font-medium text-sm tracking-wide transition-all duration-300 ${
        glow
          ? "bg-gradient-to-r from-[#a78bfa] to-[#f9a8d4] text-white shadow-lg shadow-purple-500/50 animate-pulse"
          : "bg-gradient-to-r from-[#a78bfa] to-[#f9a8d4] text-white"
      }`}
      style={{
        boxShadow: glow
          ? "0 0 30px rgba(167, 139, 250, 0.6), 0 0 60px rgba(249, 168, 212, 0.4)"
          : "none",
      }}
    >
      <Icon className="w-5 h-5" />
      {text}
    </motion.button>
  );
}
