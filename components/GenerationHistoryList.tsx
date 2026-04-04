"use client";

import { motion } from "framer-motion";
import { FileText, Image as ImageIcon, Sparkles } from "lucide-react";

interface GenerationItem {
  id: string;
  created_at: string;
  difficulty: string;
  mode: string;
  questionCount: number;
}

interface GenerationHistoryListProps {
  generations: GenerationItem[];
  activeId: string | null;
  onSelect: (id: string) => void;
  loading: boolean;
}

export function GenerationHistoryList({
  generations,
  activeId,
  onSelect,
  loading,
}: GenerationHistoryListProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-[#a78bfa] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (generations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <div className="p-4 bg-[#a78bfa]/10 rounded-full mb-4">
          <Sparkles className="w-12 h-12 text-[#a78bfa] opacity-70" />
        </div>
        <p className="text-[#f2efff] font-medium mb-2">No generations yet</p>
        <p className="text-[#857ca2] text-sm mb-6 max-w-[250px]">
          Generate questions from your notes to see different question sets here
        </p>
        <div className="w-full max-w-[200px] h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="px-4 py-2">
        <p className="text-xs text-[#857ca2] uppercase tracking-wide">
          This Session ({generations.length} generation{generations.length !== 1 ? "s" : ""})
        </p>
      </div>

      <div className="space-y-2">
        {generations.map((gen, index) => {
          const isActive = gen.id === activeId;
          const date = new Date(gen.created_at);
          const timeStr = date.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
          });

          return (
            <motion.button
              key={gen.id}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelect(gen.id)}
              className={`w-full text-left p-4 rounded-xl transition-all ${
                isActive
                  ? "bg-[#a78bfa]/20 border-2 border-[#a78bfa]/50"
                  : "bg-white/5 border border-white/10 hover:bg-white/8"
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`p-2 rounded-lg ${
                    isActive ? "bg-[#a78bfa]/30" : "bg-white/5"
                  }`}
                >
                  <Sparkles
                    className={`w-5 h-5 ${
                      isActive ? "text-[#a78bfa]" : "text-[#ddd6fe]"
                    }`}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`text-sm font-medium ${
                        isActive ? "text-[#a78bfa]" : "text-[#f2efff]"
                      }`}
                    >
                      Generation #{generations.length - index}
                    </span>
                    <span className="text-xs text-[#857ca2]">{timeStr}</span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-1 bg-[#a78bfa]/10 border border-[#a78bfa]/20 rounded text-xs text-[#a78bfa] font-medium">
                      {gen.difficulty.toUpperCase()}
                    </span>
                    <span className="px-2 py-1 bg-white/5 border border-white/10 rounded text-xs text-[#857ca2]">
                      {gen.questionCount} Q's
                    </span>
                    <span className="text-xs text-[#857ca2] truncate">
                      {gen.mode === "mix"
                        ? "Mixed"
                        : gen.mode.replace("-", " ").toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
