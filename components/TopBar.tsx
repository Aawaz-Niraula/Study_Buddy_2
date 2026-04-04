"use client";

import { Clock, MoreVertical, FlaskConical, FolderOpen } from "lucide-react";
import { motion } from "framer-motion";

interface TopBarProps {
  onTestHistoryClick: () => void;
  onSessionHistoryClick: () => void;
  onMenuClick: () => void;
}

export function TopBar({ onTestHistoryClick, onSessionHistoryClick, onMenuClick }: TopBarProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-0 left-0 right-0 z-30 px-4 py-3 bg-gradient-to-b from-[#06060b] to-transparent backdrop-blur-sm"
    >
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        {/* App Name */}
        <h1 className="text-sm font-medium tracking-[0.2em] text-[#a78bfa] uppercase">
          Study Buddy
        </h1>

        {/* Icon Buttons */}
        <div className="flex items-center gap-2">
          {/* Session History (Left Sidebar) */}
          <motion.button
            whileTap={{ opacity: 0.6 }}
            onClick={onSessionHistoryClick}
            className="p-3 rounded-full hover:bg-white/5 transition-colors min-w-[48px] min-h-[48px] flex items-center justify-center"
            aria-label="Session history"
          >
            <FolderOpen className="w-5 h-5 text-[#ddd6fe]" />
          </motion.button>

          {/* Test History (Right Sidebar) */}
          <motion.button
            whileTap={{ opacity: 0.6 }}
            onClick={onTestHistoryClick}
            className="p-3 rounded-full hover:bg-white/5 transition-colors min-w-[48px] min-h-[48px] flex items-center justify-center"
            aria-label="Test history"
          >
            <Clock className="w-5 h-5 text-[#ddd6fe]" />
          </motion.button>

          {/* Menu */}
          <motion.button
            whileTap={{ opacity: 0.6 }}
            onClick={onMenuClick}
            className="p-3 rounded-full hover:bg-white/5 transition-colors min-w-[48px] min-h-[48px] flex items-center justify-center"
            aria-label="More options"
          >
            <MoreVertical className="w-5 h-5 text-[#ddd6fe]" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
