"use client";

import { motion } from "framer-motion";

type PageTitleProps = {
  eyebrow: string;
  title: string;
  subtitle?: string;
};

export function PageTitle({ eyebrow, title, subtitle }: PageTitleProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="mb-6"
    >
      <p
        className="text-[11px] font-bold uppercase tracking-[0.3em]"
        style={{ color: "var(--accent-soft)" }}
      >
        {eyebrow}
      </p>
      <h1 className="mt-1.5 font-serif text-3xl leading-tight text-white">{title}</h1>
      {subtitle && <p className="mt-2 text-sm leading-relaxed text-white/55">{subtitle}</p>}
    </motion.div>
  );
}
