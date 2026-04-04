"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/useAuth";

export default function GreetingBanner() {
  const { user } = useAuth();
  const [show, setShow] = useState(false);
  const [firstName, setFirstName] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const full = (user as any)?.user_metadata?.full_name || (user as any)?.user_metadata?.name || null;
    if (!full) return;
    const first = String(full).split(" ")[0];
    setFirstName(first);

    try {
      const key = "studybuddy_greeting_shown";
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, "1");
        setShow(true);
        const t = setTimeout(() => setShow(false), 3000);
        return () => clearTimeout(t);
      }
    } catch (err) {
      // sessionStorage may not be available in some environments
    }
  }, [user]);

  if (!firstName) return null;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.3 }}
          className="fixed top-14 left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-lg bg-white/6 backdrop-blur-sm border border-white/10 text-sm text-white shadow-sm"
        >
          Hello, {firstName}!
        </motion.div>
      )}
    </AnimatePresence>
  );
}
