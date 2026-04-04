"use client";

import { Clock, MoreVertical, FolderOpen, User as UserIcon } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useAuth } from "@/lib/useAuth";
import { useState, useRef, useEffect } from "react";

interface TopBarProps {
  onTestHistoryClick: () => void;
  onSessionHistoryClick: () => void;
  onMenuClick: () => void;
}

export function TopBar({ onTestHistoryClick, onSessionHistoryClick, onMenuClick }: TopBarProps) {
  const { user, loading, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

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

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-0 left-0 right-0 z-30 px-4 py-2 bg-gradient-to-b from-[#06060b] to-transparent backdrop-blur-sm"
    >
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        {/* App Name */}
        <h1 className="text-sm font-medium tracking-[0.2em] text-[#a78bfa] uppercase">
          Study Buddy
        </h1>

        {/* Icon Buttons with Labels */}
        <div className="flex items-center gap-1">
          {/* Session History (Left Sidebar) */}
          <motion.button
            whileTap={{ opacity: 0.6 }}
            onClick={onSessionHistoryClick}
            className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl hover:bg-white/5 transition-colors min-w-[56px]"
            aria-label="Session history"
          >
            <FolderOpen className="w-5 h-5 text-[#ddd6fe]" />
            <span className="text-[10px] text-[#857ca2]">Sessions</span>
          </motion.button>

          {/* Test History (Right Sidebar) */}
          <motion.button
            whileTap={{ opacity: 0.6 }}
            onClick={onTestHistoryClick}
            className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl hover:bg-white/5 transition-colors min-w-[56px]"
            aria-label="Test history"
          >
            <Clock className="w-5 h-5 text-[#ddd6fe]" />
            <span className="text-[10px] text-[#857ca2]">Tests</span>
          </motion.button>

          {/* Menu */}
          <motion.button
            whileTap={{ opacity: 0.6 }}
            onClick={onMenuClick}
            className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl hover:bg-white/5 transition-colors min-w-[56px]"
            aria-label="More options"
          >
            <MoreVertical className="w-5 h-5 text-[#ddd6fe]" />
            <span className="text-[10px] text-[#857ca2]">Menu</span>
          </motion.button>

          {/* Auth / Avatar */}
          {!loading && (
            user ? (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen((s) => !s)}
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-xl hover:bg-white/5 transition-colors"
                  aria-label="Account menu"
                >
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatarUrl} alt="avatar" className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <div className="w-8 h-8 flex items-center justify-center bg-white/5 rounded-full">
                      <UserIcon className="w-5 h-5 text-[#a78bfa]" />
                    </div>
                  )}
                  <span className="text-[12px] text-[#857ca2] truncate max-w-[120px]">{user.email?.split('@')[0]}</span>
                </button>

                {menuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="absolute right-0 mt-2 w-64 bg-[#0b0b12] border border-white/8 rounded-xl p-4 shadow-lg"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      {avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={avatarUrl} alt="avatar" className="w-12 h-12 rounded-full object-cover" />
                      ) : (
                        <div className="w-12 h-12 flex items-center justify-center bg-white/5 rounded-full">
                          <UserIcon className="w-6 h-6 text-[#a78bfa]" />
                        </div>
                      )}
                      <div>
                        <div className="text-sm font-medium text-white">{fullName || user.email}</div>
                        <div className="text-xs text-[#857ca2]">{user.email}</div>
                      </div>
                    </div>

                    <div className="mt-2">
                      <button
                        onClick={async () => { await signOut(); setMenuOpen(false); }}
                        className="w-full text-left text-red-400 hover:bg-white/5 px-3 py-2 rounded-md"
                      >
                        Log out
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            ) : (
              <Link href="/login">
                <motion.div
                  whileTap={{ opacity: 0.6 }}
                  className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl hover:bg-white/5 transition-colors min-w-[56px]"
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
