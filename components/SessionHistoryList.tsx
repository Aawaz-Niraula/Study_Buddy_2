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
      {hasCurrentSession && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-2">
            <div className="h-2 w-2 animate-pulse rounded-full bg-green-400" />
            <p className="text-xs uppercase tracking-wide text-[#857ca2]">Current Session</p>
          </div>

          <div className="rounded-xl border border-[#a78bfa]/20 bg-gradient-to-r from-[#a78bfa]/10 to-[#f9a8d4]/10 p-3">
            <p className="mb-1 truncate text-sm font-medium text-[#f2efff]">
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
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onSelectGeneration(gen.id)}
                    className={`w-full rounded-lg p-3 text-left transition-all ${
                      isActive
                        ? "border border-[#a78bfa]/50 bg-[#a78bfa]/20"
                        : "border border-transparent bg-white/5 hover:bg-white/8"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles className={`h-4 w-4 ${isActive ? "text-[#a78bfa]" : "text-[#857ca2]"}`} />
                      <span className={`text-sm ${isActive ? "text-[#a78bfa]" : "text-[#f2efff]"}`}>
                        Gen #{currentGenerations.length - index}
                      </span>
                      <span className="ml-auto text-xs text-[#857ca2]">{timeStr}</span>
                    </div>
                    <div className="mt-1 ml-6 flex items-center gap-2">
                      <span className="text-xs text-[#a78bfa]">{gen.difficulty}</span>
                      <span className="text-xs text-[#857ca2]">• {gen.questionCount} Q</span>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {previousSessions.length > 0 && (
        <div className="space-y-3">
          <p className="px-2 text-xs uppercase tracking-wide text-[#857ca2]">
            Previous Sessions ({previousSessions.length})
          </p>

          <div className="space-y-2">
            {previousSessions.map((session, idx) => {
              const Icon = getIcon(session.source_kind);
              const date = new Date(session.updated_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              });

              return (
                <div key={session.id} className="flex items-stretch gap-2">
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    whileTap={{ opacity: 0.6, scale: 0.98 }}
                    onClick={() => onSelectSession(session.id)}
                    className="flex-1 rounded-xl border border-white/10 bg-white/5 p-3 text-left transition-all hover:border-white/20 hover:bg-white/8"
                  >
                    <div className="flex items-start gap-3">
                      <div className="rounded-lg bg-[#a78bfa]/10 p-2">
                        <Icon className="h-4 w-4 text-[#a78bfa]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-sm font-medium text-[#f2efff]">
                          {session.title || "Untitled"}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-[#857ca2]">
                          <span>{date}</span>
                          {session.questionCount !== undefined && (
                            <>
                              <span>•</span>
                              <span>{session.questionCount} Q</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.button>

                  {onDeleteSession && (
                    <button
                      type="button"
                      onClick={() => onDeleteSession(session.id)}
                      disabled={actionLoading || deletingSessionId === session.id}
                      className="flex w-11 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 transition-colors hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-60"
                      aria-label={`Delete ${session.title || "session"}`}
                    >
                      {deletingSessionId === session.id ? (
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
