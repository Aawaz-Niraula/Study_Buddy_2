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
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/65 backdrop-blur-md z-40"
          />

          <motion.div
            initial={{ y: "100%", opacity: 0.92 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0.92 }}
            transition={{
              type: "spring",
              stiffness: 340,
              damping: 34,
              mass: 0.9,
            }}
            className="fixed bottom-0 left-0 right-0 z-50 max-h-[88vh] overflow-y-auto rounded-t-[28px] border border-white/10 bg-[#0b0b12]/96 sm:left-1/2 sm:bottom-6 sm:max-h-[min(80vh,720px)] sm:w-[min(92vw,36rem)] sm:-translate-x-1/2 sm:rounded-[30px] sm:border-white/12"
            style={{
              boxShadow: "0 18px 60px rgba(0,0,0,0.45)",
            }}
          >
            <div className="flex justify-center pt-3 pb-2 sm:pt-4">
              <div className="h-1.5 w-14 rounded-full bg-gradient-to-r from-white/10 via-white/25 to-white/10" />
            </div>

            <div
              className="px-4 sm:px-6 pb-8"
              style={{ paddingBottom: "max(2rem, env(safe-area-inset-bottom))" }}
            >
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
