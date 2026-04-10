"use client";

import { motion } from "framer-motion";
import {
  FileText,
  Image as ImageIcon,
  FileImage,
  Sparkles,
  FolderOpen,
  Trash2,
  Loader2,
} from "lucide-react";

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
  currentSessionId: string | null;
  currentSessionTitle: string;
  currentGenerations: {
    id: string;
    created_at: string;
    difficulty: string;
    mode: string;
    questionCount: number;
  }[];
  activeGenerationId: string | null;
  onSelectSession: (id: string) => void;
  onSelectGeneration: (id: string) => void;
  onDeleteSession?: (id: string) => void;
  loading?: boolean;
  actionLoading?: boolean;
  deletingSessionId?: string | null;
}

export function SessionHistoryList({
  sessions,
  currentSessionId,
  currentSessionTitle,
  currentGenerations,
  activeGenerationId,
  onSelectSession,
  onSelectGeneration,
  onDeleteSession,
  loading,
  actionLoading,
  deletingSessionId,
}: SessionHistoryListProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#a78bfa] border-t-transparent" />
      </div>
    );
  }

  const getIcon = (sourceKind: string) => {
    if (sourceKind === "image") return ImageIcon;
    if (sourceKind === "pdf") return FileImage;
    return FileText;
  };

  const hasCurrentSession = currentGenerations.length > 0 || currentSessionId;
  const previousSessions = sessions.filter((session) => session.id !== currentSessionId);

  if (!hasCurrentSession && previousSessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
        <div className="mb-4 rounded-full bg-[#a78bfa]/10 p-4">
          <FolderOpen className="h-12 w-12 text-[#a78bfa] opacity-70" />
        </div>
        <p className="mb-2 font-medium text-[#f2efff]">No sessions yet</p>
        <p className="mb-6 max-w-[250px] text-sm text-[#857ca2]">
          Add notes or upload files and generate questions to create your first session.
        </p>
        <div className="h-px w-full max-w-[200px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Session */}
      {hasCurrentSession && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <div className="h-2 w-2 animate-pulse rounded-full bg-green-400 shrink-0" />
            <p className="text-xs uppercase tracking-wide text-[#857ca2]">Current Session</p>
          </div>

          <div className="rounded-2xl border border-[#a78bfa]/20 bg-gradient-to-r from-[#a78bfa]/10 via-[#10101a] to-[#f9a8d4]/10 p-4 shadow-[0_14px_30px_rgba(9,9,16,0.28)]">
            {/* Title: fixed 2-line height, ellipsis on overflow */}
            <p className="text-sm font-semibold text-[#f2efff] leading-snug line-clamp-2 break-all mb-1">
              {currentSessionTitle || "New Session"}
            </p>
            <p className="text-xs text-[#857ca2]">
              {currentGenerations.length} generation{currentGenerations.length === 1 ? "" : "s"}
            </p>
          </div>

          {currentGenerations.length > 0 && (
            <div className="space-y-2 pl-2">
              {currentGenerations.map((gen, index) => {
                const isActive = gen.id === activeGenerationId;
                const timeStr = new Date(gen.created_at).toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                });

                return (
                  <motion.button
                    key={gen.id}
                    whileTap={{ scale: 0.985 }}
                    onClick={() => onSelectGeneration(gen.id)}
                    className={`w-full rounded-xl p-3.5 text-left transition-all ${
                      isActive
                        ? "border border-[#a78bfa]/45 bg-gradient-to-r from-[#a78bfa]/18 to-[#f9a8d4]/10 shadow-[0_12px_26px_rgba(11,11,18,0.22)]"
                        : "border border-white/8 bg-white/5 hover:border-white/15 hover:bg-white/8"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Sparkles className={`h-4 w-4 shrink-0 ${isActive ? "text-[#a78bfa]" : "text-[#857ca2]"}`} />
                      <span className={`text-sm font-medium truncate ${isActive ? "text-[#ddd6fe]" : "text-[#f2efff]"}`}>
                        Gen #{currentGenerations.length - index}
                      </span>
                      <span className="ml-auto text-xs text-[#857ca2] shrink-0 pl-1">{timeStr}</span>
                    </div>
                    <div className="mt-1 ml-6 flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-[#a78bfa]">{gen.difficulty}</span>
                      <span className="text-xs text-[#857ca2]">· {gen.questionCount} Q</span>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Previous Sessions */}
      {previousSessions.length > 0 && (
        <div className="space-y-3">
          <p className="px-1 text-xs uppercase tracking-wide text-[#857ca2]">
            Previous Sessions ({previousSessions.length})
          </p>

          <div className="space-y-2">
            {previousSessions.map((session, idx) => {
              const Icon = getIcon(session.source_kind);
              const date = new Date(session.updated_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              });
              const isDeleting = deletingSessionId === session.id;

              return (
                /* Outer wrapper: fixed height row so all cards are uniform */
                <div key={session.id} className="flex items-stretch gap-2 h-[72px]">
                  <motion.button
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    whileTap={{ opacity: 0.7, scale: 0.985 }}
                    onClick={() => onSelectSession(session.id)}
                    /* flex-1 so the delete button always gets exactly 44px */
                    className="flex-1 min-w-0 rounded-2xl border border-white/10 bg-gradient-to-r from-white/[0.06] to-white/[0.03] px-3 py-0 text-left transition-all hover:border-white/20 hover:bg-white/8 hover:shadow-[0_14px_28px_rgba(9,9,16,0.22)] flex items-center"
                  >
                    <div className="flex items-center gap-3 min-w-0 w-full">
                      {/* Icon badge — fixed size, never shrinks */}
                      <div className="shrink-0 rounded-xl bg-[#a78bfa]/10 p-2">
                        <Icon className="h-4 w-4 text-[#a78bfa]" />
                      </div>

                      {/* Text block: takes all remaining space, clips overflow */}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-[#f2efff] truncate leading-snug">
                          {session.title || "Untitled"}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5 text-xs text-[#857ca2]">
                          <span className="shrink-0">{date}</span>
                          {session.questionCount !== undefined && (
                            <>
                              <span className="shrink-0">·</span>
                              <span className="shrink-0">{session.questionCount} Q</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.button>

                  {/* Delete button — fixed width, always visible */}
                  {onDeleteSession && (
                    <button
                      type="button"
                      onClick={() => onDeleteSession(session.id)}
                      disabled={actionLoading || isDeleting}
                      className="shrink-0 w-11 flex items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 text-red-400 transition-colors hover:bg-red-500/20 active:bg-red-500/25 disabled:cursor-not-allowed disabled:opacity-50"
                      aria-label={`Delete ${session.title || "session"}`}
                    >
                      {isDeleting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}