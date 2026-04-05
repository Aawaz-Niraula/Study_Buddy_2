"use client";

import { ReactNode, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  side: "left" | "right";
  children: ReactNode;
  title?: string;
}

export function Sidebar({ isOpen, onClose, side, children, title }: SidebarProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: side === "left" ? "-100%" : "100%" }}
            animate={{ x: 0 }}
            exit={{ x: side === "left" ? "-100%" : "100%" }}
            transition={{
              type: "tween",
              duration: 0.25,
              ease: [0.25, 0.1, 0.25, 1],
            }}
            className={`fixed top-0 ${side === "left" ? "left-0" : "right-0"} bottom-0 w-[85vw] max-w-[360px] sm:w-[80vw] sm:max-w-[360px] bg-[#0b0b12] z-50 flex flex-col`}
            style={{
              boxShadow: side === "left" ? "4px 0 24px rgba(0,0,0,0.5)" : "-4px 0 24px rgba(0,0,0,0.5)",
              willChange: "transform",
            }}
          >
            {/* Header - Fixed */}
            <div className="shrink-0 bg-[#0b0b12] border-b border-white/10 px-4 py-3 flex items-center justify-between">
              <h2 className="text-sm font-medium text-[#f2efff] tracking-wide uppercase">
                {title || "Menu"}
              </h2>
              <motion.button
                whileTap={{ opacity: 0.6, scale: 0.95 }}
                onClick={onClose}
                className="p-2 rounded-full hover:bg-white/5 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Close sidebar"
              >
                <X className="w-5 h-5 text-[#ddd6fe]" />
              </motion.button>
            </div>

            {/* Content - Scrollable */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain p-4">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
