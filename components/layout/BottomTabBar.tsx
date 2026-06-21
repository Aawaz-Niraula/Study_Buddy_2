"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Sparkles, PencilLine, Clock, TrendingUp, User, type LucideIcon } from "lucide-react";

type Tab = { href: string; label: string; icon: LucideIcon };

const TABS: Tab[] = [
  { href: "/", label: "Generate", icon: Sparkles },
  { href: "/tests", label: "Tests", icon: PencilLine },
  { href: "/history", label: "History", icon: Clock },
  { href: "/progress", label: "Progress", icon: TrendingUp },
  { href: "/account", label: "Account", icon: User },
];

export function BottomTabBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/[0.06] bg-[#06060b]/85 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-2xl items-stretch justify-around px-2">
        {TABS.map((tab) => {
          const active = tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className="relative flex flex-1 flex-col items-center gap-1 py-2.5"
            >
              {active && (
                <motion.span
                  layoutId="tab-pill"
                  className="absolute inset-x-2 inset-y-1 rounded-2xl"
                  style={{ background: "rgba(var(--accent-glow), 0.16)" }}
                  transition={{ type: "spring", damping: 26, stiffness: 320 }}
                />
              )}
              <Icon
                className="relative h-5 w-5 transition-colors"
                style={{ color: active ? "var(--accent-soft)" : "rgba(255,255,255,0.45)" }}
              />
              <span
                className="relative text-[10px] font-semibold uppercase tracking-wider transition-colors"
                style={{ color: active ? "var(--accent-soft)" : "rgba(255,255,255,0.45)" }}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
