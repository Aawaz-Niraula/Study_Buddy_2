"use client";

import { Clock, MoreVertical, FolderOpen, User as UserIcon, LogOut, Settings, UserCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useAuth } from "@/lib/useAuth";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

interface TopBarProps {
  onTestHistoryClick: () => void;
  onSessionHistoryClick: () => void;
  onMenuClick: () => void;
}

export function TopBar({ onTestHistoryClick, onSessionHistoryClick, onMenuClick }: TopBarProps) {
  const { user, loading, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();

  const avatarUrl = (user as any)?.user_metadata?.avatar_url || (user as any)?.user_metadata?.picture || null;
  const fullName = (user as any)?.user_metadata?.full_name || (user as any)?.user_metadata?.name || null;

  useEffect(() => {
    function onBodyClick(e: MouseEvent) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("click", onBodyClick);
    return () => document.removeEventListener("click", onBodyClick);
  }, []);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
      setMenuOpen(false);
      router.push("/login");
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-0 left-0 right-0 z-30"
    >
      {/* Blur + gradient backdrop */}
      <div className="absolute inset-0 bg-[#06060b]/70 backdrop-blur-xl border-b border-white/[0.04] shadow-[0_4px_30px_rgba(0,0,0,0.1)]" />

      <div className="relative max-w-5xl mx-auto flex items-center justify-between h-14 px-3 sm:px-5">
        {/* App Name */}
        <h1 className="text-xs font-bold tracking-[0.22em] text-[#a78bfa] uppercase select-none">
          Study Buddy
        </h1>

        {/* Nav Actions */}
        <nav className="flex items-center gap-0.5 sm:gap-1" aria-label="Main navigation">
          <NavBtn icon={<FolderOpen className="w-[18px] h-[18px]" />} label="Sessions" onClick={onSessionHistoryClick} />
          <NavBtn icon={<Clock className="w-[18px] h-[18px]" />} label="Tests" onClick={onTestHistoryClick} />
          <NavBtn icon={<MoreVertical className="w-[18px] h-[18px]" />} label="Menu" onClick={onMenuClick} />

          {/* Auth */}
          {!loading && (
            user ? (
              <div className="relative ml-1" ref={menuRef}>
                <motion.button
                  whileTap={{ scale: 0.94 }}
                  onClick={() => setMenuOpen((s) => !s)}
                  className="flex items-center justify-center w-9 h-9 rounded-xl hover:bg-white/6 active:bg-white/10 transition-colors"
                  aria-label="Account menu"
                >
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatarUrl}
                      alt="avatar"
                      className="w-7 h-7 rounded-full object-cover ring-2 ring-[#a78bfa]/40"
                    />
                  ) : (
                    <div className="w-7 h-7 flex items-center justify-center bg-gradient-to-br from-[#a78bfa]/25 to-[#f9a8d4]/25 rounded-full ring-2 ring-[#a78bfa]/30">
                      <UserIcon className="w-4 h-4 text-[#a78bfa]" />
                    </div>
                  )}
                </motion.button>

                {/* Dropdown */}
                <AnimatePresence>
                  {menuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.94 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.94 }}
                      transition={{ type: "spring", stiffness: 450, damping: 25 }}
                      className="absolute right-0 mt-2 w-72 bg-[#0d0d16]/90 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-2xl shadow-black/80 overflow-hidden"
                    >
                      {/* User Info */}
                      <div className="p-4 bg-gradient-to-r from-[#a78bfa]/8 to-[#f9a8d4]/8 border-b border-white/[0.06]">
                        <div className="flex items-center gap-3">
                          {avatarUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={avatarUrl} alt="avatar" className="w-11 h-11 rounded-full object-cover ring-2 ring-[#a78bfa]/40" />
                          ) : (
                            <div className="w-11 h-11 flex items-center justify-center bg-gradient-to-br from-[#a78bfa]/20 to-[#f9a8d4]/20 rounded-full ring-2 ring-[#a78bfa]/40">
                              <UserIcon className="w-5 h-5 text-[#a78bfa]" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-[#f2efff] truncate">
                              {fullName || "User"}
                            </p>
                            <p className="text-xs text-[#857ca2] truncate mt-0.5">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Items */}
                      <div className="p-2 space-y-0.5">
                        <DropdownItem
                          icon={<UserCircle className="w-4 h-4" />}
                          label="Profile"
                          soon
                          onClick={() => setMenuOpen(false)}
                        />
                        <DropdownItem
                          icon={<Settings className="w-4 h-4" />}
                          label="Settings"
                          soon
                          onClick={() => setMenuOpen(false)}
                        />
                      </div>

                      <div className="border-t border-white/[0.06] p-2">
                        <button
                          onClick={handleSignOut}
                          disabled={signingOut}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-500/10 active:bg-red-500/18 transition-colors disabled:opacity-50"
                        >
                          <LogOut className="w-4 h-4 shrink-0" />
                          <span>{signingOut ? "Signing out…" : "Log Out"}</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link href="/login" className="ml-1">
                <motion.div
                  whileTap={{ scale: 0.92 }}
                  className="flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-xl hover:bg-white/5 transition-colors"
                >
                  <UserIcon className="w-[18px] h-[18px] text-[#a78bfa]" />
                  <span className="text-[9px] font-medium text-[#a78bfa] leading-none">Sign In</span>
                </motion.div>
              </Link>
            )
          )}
        </nav>
      </div>
    </motion.header>
  );
}

/* ── Reusable sub-components ─────────────────────────────────────── */

function NavBtn({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.90, opacity: 0.6 }}
      onClick={onClick}
      className="flex flex-col items-center gap-0.5 px-2.5 sm:px-3 py-1.5 rounded-xl hover:bg-white/5 active:bg-white/10 transition-colors text-[#ddd6fe] min-w-[44px]"
    >
      {icon}
      <span className="text-[9px] font-medium text-[#857ca2] leading-none">{label}</span>
    </motion.button>
  );
}

function DropdownItem({
  icon,
  label,
  soon,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  soon?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[#ddd6fe] hover:bg-white/5 active:bg-white/10 transition-colors"
      onClick={onClick}
    >
      <span className="text-[#857ca2]">{icon}</span>
      <span>{label}</span>
      {soon && (
        <span className="ml-auto text-[9px] font-medium text-[#857ca2]/70 bg-white/[0.06] px-2 py-0.5 rounded-full tracking-wide">
          SOON
        </span>
      )}
    </button>
  );
}