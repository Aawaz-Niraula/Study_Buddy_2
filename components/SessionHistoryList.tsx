"use client";

import { motion } from "framer-motion";
import { FileText, Image as ImageIcon, FileImage } from "lucide-react";

export interface SessionItem {
  id: string;
  title: string;
  updated_at: string;
  latest_mode: string;
  latest_difficulty: string;
  source_kind: string;
  questionCount?: number;
}

interface SessionHistoryListProps {
  sessions: SessionItem[];
  onSelectSession: (id: string) => void;
  loading?: boolean;
}

export function SessionHistoryList({
  sessions,
  onSelectSession,
  loading,
}: SessionHistoryListProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-[#857ca2] text-sm">Loading sessions...</div>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <FileText className="w-12 h-12 text-[#857ca2]/50 mb-3" />
        <p className="text-[#857ca2] text-sm">No previous sessions</p>
      </div>
    );
  }

  const getIcon = (sourceKind: string) => {
    if (sourceKind === "image") return ImageIcon;
    if (sourceKind === "pdf") return FileImage;
    return FileText;
  };

  return (
    <div className="space-y-3">
      {sessions.map((session, idx) => {
        const Icon = getIcon(session.source_kind);
        const date = new Date(session.updated_at).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });

        return (
          <motion.button
            key={session.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            whileTap={{ opacity: 0.6, scale: 0.98 }}
            onClick={() => onSelectSession(session.id)}
            className="w-full text-left p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/8 hover:border-white/20 transition-all"
          >
            <div className="flex items-start gap-3">
              {/* Icon */}
              <div className="p-2 rounded-lg bg-[#a78bfa]/10">
                <Icon className="w-5 h-5 text-[#a78bfa]" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-[#f2efff] truncate mb-1">
                  {session.title || "Untitled Session"}
                </h3>
                <div className="flex items-center gap-2 text-xs text-[#857ca2]">
                  <span>{date}</span>
                  {session.questionCount !== undefined && (
                    <>
                      <span>•</span>
                      <span>{session.questionCount} questions</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
