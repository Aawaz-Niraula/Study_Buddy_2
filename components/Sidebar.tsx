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
            transition={{ duration: 0.3 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: side === "left" ? "-100%" : "100%" }}
            animate={{ x: 0 }}
            exit={{ x: side === "left" ? "-100%" : "100%" }}
            transition={{
              duration: 0.3,
              ease: [0.4, 0.0, 0.2, 1], // cubic-bezier
            }}
            className={`fixed top-0 ${side === "left" ? "left-0" : "right-0"} bottom-0 w-[80%] max-w-md bg-[#0b0b12] z-50 overflow-y-auto`}
            style={{
              boxShadow: side === "left" ? "4px 0 24px rgba(0,0,0,0.5)" : "-4px 0 24px rgba(0,0,0,0.5)",
            }}
          >
            {/* Header */}
            <div className="sticky top-0 bg-[#0b0b12] border-b border-white/10 px-6 py-4 flex items-center justify-between">
              <h2 className="text-base font-medium text-[#f2efff] tracking-wide uppercase text-sm">
                {title || "Menu"}
              </h2>
              <motion.button
                whileTap={{ opacity: 0.6 }}
                onClick={onClose}
                className="p-2 rounded-full hover:bg-white/5 transition-colors"
                aria-label="Close sidebar"
              >
                <X className="w-5 h-5 text-[#ddd6fe]" />
              </motion.button>
            </div>

            {/* Content */}
            <div className="p-6">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
