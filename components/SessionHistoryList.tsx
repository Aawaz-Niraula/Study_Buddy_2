"use client";

import { motion } from "framer-motion";
import { FileText, Image as ImageIcon, FileImage, Sparkles, FolderOpen, Trash2, Loader2 } from "lucide-react";

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
  actionLoading = false,
  deletingSessionId = null,
}: SessionHistoryListProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-[#a78bfa] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const getIcon = (sourceKind: string) => {
    if (sourceKind === "image") return ImageIcon;
    if (sourceKind === "pdf") return FileImage;
    return FileText;
  };

  const hasCurrentSession = currentGenerations.length > 0 || currentSessionId;
  const hasHistory = sessions.length > 0;

  if (!hasCurrentSession && !hasHistory) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <div className="p-4 bg-[#a78bfa]/10 rounded-full mb-4">
          <FolderOpen className="w-12 h-12 text-[#a78bfa] opacity-70" />
        </div>
        <p className="text-[#f2efff] font-medium mb-2">No sessions yet</p>
        <p className="text-[#857ca2] text-sm mb-6 max-w-[250px]">
          Add notes or upload files and generate questions to create your first session
        </p>
        <div className="w-full max-w-[200px] h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Session Section */}
      {hasCurrentSession && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <p className="text-xs text-[#857ca2] uppercase tracking-wide">
              Current Session
            </p>
          </div>
          
          <div className="p-3 bg-gradient-to-r from-[#a78bfa]/10 to-[#f9a8d4]/10 border border-[#a78bfa]/20 rounded-xl">
            <p className="text-sm font-medium text-[#f2efff] mb-1 truncate">
              {currentSessionTitle || "New Session"}
            </p>
            <p className="text-xs text-[#857ca2]">
              {currentGenerations.length} generation{currentGenerations.length !== 1 ? "s" : ""}
            </p>
          </div>

          {/* Generation list in current session */}
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
                    type="button"
                    disabled={actionLoading}
                    whileTap={{ scale: actionLoading ? 1 : 0.98 }}
                    onClick={() => !actionLoading && onSelectGeneration(gen.id)}
                    className={`w-full text-left p-3 rounded-lg transition-all ${
                      isActive
                        ? "bg-[#a78bfa]/20 border border-[#a78bfa]/50"
                        : "bg-white/5 border border-transparent hover:bg-white/8"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles className={`w-4 h-4 ${isActive ? "text-[#a78bfa]" : "text-[#857ca2]"}`} />
                      <span className={`text-sm ${isActive ? "text-[#a78bfa]" : "text-[#f2efff]"}`}>
                        Gen #{currentGenerations.length - index}
                      </span>
                      <span className="text-xs text-[#857ca2] ml-auto">{timeStr}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 ml-6">
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

      {/* Previous Sessions Section */}
      {hasHistory && (
        <div className="space-y-3">
          <p className="text-xs text-[#857ca2] uppercase tracking-wide px-2">
            Previous Sessions ({sessions.length})
          </p>

          <div className="space-y-2">
            {sessions.filter(s => s.id !== currentSessionId).map((session, idx) => {
              const Icon = getIcon(session.source_kind);
              const date = new Date(session.updated_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              });

              const isBusy = actionLoading || deletingSessionId === session.id;

              return (
                <div
                  key={session.id}
                  className="flex items-stretch gap-2"
                >
                  <motion.button
                    type="button"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    whileTap={{ opacity: isBusy ? 1 : 0.6, scale: isBusy ? 1 : 0.98 }}
                    disabled={actionLoading}
                    onClick={() => !actionLoading && onSelectSession(session.id)}
                    className="flex-1 min-w-0 text-left p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/8 hover:border-white/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-[#a78bfa]/10 shrink-0">
                        <Icon className="w-4 h-4 text-[#a78bfa]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-[#f2efff] truncate">
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
                      disabled={isBusy}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isBusy) onDeleteSession(session.id);
                      }}
                      className="shrink-0 self-stretch px-3 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/15 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
                      aria-label={`Delete session ${session.title || session.id}`}
                    >
                      {deletingSessionId === session.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
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
