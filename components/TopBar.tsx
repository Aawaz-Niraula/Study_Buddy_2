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
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-0 left-0 right-0 z-30 px-4 py-2 bg-gradient-to-b from-[#06060b] to-transparent backdrop-blur-sm"
    >
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-1 sm:gap-2">
        {/* App Name */}
        <h1 className="text-sm font-medium tracking-[0.2em] text-[#a78bfa] uppercase">
          Study Buddy
        </h1>

        {/* Icon Buttons with Labels */}
        <div className="flex items-center gap-0 sm:gap-1">
          {/* Session History (Left Sidebar) */}
          <motion.button
            whileTap={{ scale: 0.92, opacity: 0.6 }}
            onClick={onSessionHistoryClick}
            className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl hover:bg-white/5 active:bg-white/10 transition-colors min-w-[56px]"
            aria-label="Session history"
          >
            <FolderOpen className="w-5 h-5 text-[#ddd6fe]" />
            <span className="text-[10px] text-[#857ca2]">Sessions</span>
          </motion.button>

          {/* Test History (Right Sidebar) */}
          <motion.button
            whileTap={{ scale: 0.92, opacity: 0.6 }}
            onClick={onTestHistoryClick}
            className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl hover:bg-white/5 active:bg-white/10 transition-colors min-w-[56px]"
            aria-label="Test history"
          >
            <Clock className="w-5 h-5 text-[#ddd6fe]" />
            <span className="text-[10px] text-[#857ca2]">Tests</span>
          </motion.button>

          {/* Menu */}
          <motion.button
            whileTap={{ scale: 0.92, opacity: 0.6 }}
            onClick={onMenuClick}
            className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl hover:bg-white/5 active:bg-white/10 transition-colors min-w-[56px]"
            aria-label="More options"
          >
            <MoreVertical className="w-5 h-5 text-[#ddd6fe]" />
            <span className="text-[10px] text-[#857ca2]">Menu</span>
          </motion.button>

          {/* Auth / Avatar */}
          {!loading && (
            user ? (
              <div className="relative" ref={menuRef}>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setMenuOpen((s) => !s)}
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-xl hover:bg-white/5 active:bg-white/10 transition-colors"
                  aria-label="Account menu"
                >
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatarUrl} alt="avatar" className="w-8 h-8 rounded-full object-cover ring-2 ring-[#a78bfa]/30" />
                  ) : (
                    <div className="w-8 h-8 flex items-center justify-center bg-gradient-to-br from-[#a78bfa]/20 to-[#f9a8d4]/20 rounded-full ring-2 ring-[#a78bfa]/30">
                      <UserIcon className="w-5 h-5 text-[#a78bfa]" />
                    </div>
                  )}
                </motion.button>

                {/* Avatar Dropdown Menu */}
                <AnimatePresence>
                  {menuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.95 }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                      className="absolute right-0 mt-2 w-72 bg-[#0b0b12]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden"
                    >
                      {/* User Info Header */}
                      <div className="p-4 bg-gradient-to-r from-[#a78bfa]/5 to-[#f9a8d4]/5 border-b border-white/5">
                        <div className="flex items-center gap-3">
                          {avatarUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={avatarUrl} alt="avatar" className="w-12 h-12 rounded-full object-cover ring-2 ring-[#a78bfa]/40" />
                          ) : (
                            <div className="w-12 h-12 flex items-center justify-center bg-gradient-to-br from-[#a78bfa]/20 to-[#f9a8d4]/20 rounded-full ring-2 ring-[#a78bfa]/40">
                              <UserIcon className="w-6 h-6 text-[#a78bfa]" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-[#f2efff] truncate">
                              {fullName || "User"}
                            </p>
                            <p className="text-xs text-[#857ca2] truncate">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Menu Items */}
                      <div className="p-2">
                        <button
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[#ddd6fe] hover:bg-white/5 active:bg-white/10 transition-colors"
                          onClick={() => setMenuOpen(false)}
                        >
                          <UserCircle className="w-4 h-4 text-[#857ca2]" />
                          <span>Profile</span>
                          <span className="ml-auto text-[10px] text-[#857ca2]/60 bg-white/5 px-2 py-0.5 rounded-full">Soon</span>
                        </button>
                        <button
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[#ddd6fe] hover:bg-white/5 active:bg-white/10 transition-colors"
                          onClick={() => setMenuOpen(false)}
                        >
                          <Settings className="w-4 h-4 text-[#857ca2]" />
                          <span>Settings</span>
                          <span className="ml-auto text-[10px] text-[#857ca2]/60 bg-white/5 px-2 py-0.5 rounded-full">Soon</span>
                        </button>
                      </div>

                      {/* Divider + Logout */}
                      <div className="border-t border-white/5 p-2">
                        <button
                          onClick={handleSignOut}
                          disabled={signingOut}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-500/10 active:bg-red-500/20 transition-colors disabled:opacity-50"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>{signingOut ? "Signing out..." : "Log Out"}</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link href="/login">
                <motion.div
                  whileTap={{ scale: 0.92, opacity: 0.6 }}
                  className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl hover:bg-white/5 active:bg-white/10 transition-colors min-w-[56px]"
                >
                  <UserIcon className="w-5 h-5 text-[#a78bfa]" />
                  <span className="text-[10px] text-[#a78bfa]">Sign In</span>
                </motion.div>
              </Link>
            )
          )}
        </div>
      </div>
    </motion.div>
  );
}
