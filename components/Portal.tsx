"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

/** Renders children into document.body so full-screen overlays escape any
 *  transformed ancestor (which would otherwise trap position:fixed + z-index). */
export function Portal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return createPortal(children, document.body);
}
