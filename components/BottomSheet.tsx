"use client";

import { ReactNode, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}

export function BottomSheet({ isOpen, onClose, children }: BottomSheetProps) {
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
          {/* Overlay — no backdrop-blur (too expensive on mobile) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 z-40"
          />

          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{
              type: "spring",
              stiffness: 380,
              damping: 38,
              mass: 0.8,
            }}
            className="fixed bottom-0 left-0 right-0 z-50 max-h-[88vh] overflow-y-auto rounded-t-[28px] border border-white/10 bg-[#0b0b12] sm:left-1/2 sm:bottom-6 sm:max-h-[min(80vh,720px)] sm:w-[min(92vw,36rem)] sm:-translate-x-1/2 sm:rounded-[30px] sm:border-white/12"
            style={{
              boxShadow: "0 -4px 40px rgba(0,0,0,0.5)",
              willChange: "transform",
            }}
          >
            <div className="flex justify-center pt-3 pb-2 sm:pt-4">
              <div className="h-1.5 w-14 rounded-full bg-gradient-to-r from-white/10 via-white/25 to-white/10" />
            </div>

            {/* pb-24 on mobile clears the bottom tab bar (~72px); sm+ floats above it */}
            <div className="px-4 pb-24 sm:px-6 sm:pb-8">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
