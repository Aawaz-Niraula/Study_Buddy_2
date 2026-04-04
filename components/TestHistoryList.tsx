"use client";

import { motion } from "framer-motion";
import { Trophy, Clock as ClockIcon, TrendingUp } from "lucide-react";

export interface TestSubmissionItem {
  id: string;
  created_at: string;
  score: number;
  total: number;
  sessionTitle?: string;
}

interface TestHistoryListProps {
  tests: TestSubmissionItem[];
  onSelectTest: (id: string) => void;
  loading?: boolean;
}

export function TestHistoryList({
  tests,
  onSelectTest,
  loading,
}: TestHistoryListProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-[#a78bfa] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (tests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <div className="p-4 bg-[#a78bfa]/10 rounded-full mb-4">
          <Trophy className="w-12 h-12 text-[#a78bfa] opacity-70" />
        </div>
        <p className="text-[#f2efff] font-medium mb-2">No tests taken yet</p>
        <p className="text-[#857ca2] text-sm mb-6 max-w-[250px]">
          Generate questions and take a test to track your progress here
        </p>
        <div className="w-full max-w-[200px] h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>
    );
  }

  const getScoreColor = (percentage: number) => {
    if (percentage >= 70) return { bg: "bg-green-500/10", border: "border-green-500/40", text: "text-green-400", badge: "bg-green-500" };
    if (percentage >= 50) return { bg: "bg-yellow-500/10", border: "border-yellow-500/40", text: "text-yellow-400", badge: "bg-yellow-500" };
    return { bg: "bg-red-500/10", border: "border-red-500/40", text: "text-red-400", badge: "bg-red-500" };
  };

  // Calculate average score
  const avgScore = tests.length > 0 
    ? Math.round(tests.reduce((sum, t) => sum + (t.score / t.total) * 100, 0) / tests.length)
    : 0;

  return (
    <div className="space-y-4">
      {/* Stats Header */}
      <div className="p-4 bg-gradient-to-r from-[#a78bfa]/10 to-[#f9a8d4]/10 border border-[#a78bfa]/20 rounded-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#a78bfa]/20 rounded-lg">
              <TrendingUp className="w-4 h-4 text-[#a78bfa]" />
            </div>
            <div>
              <p className="text-xs text-[#857ca2]">Tests Taken</p>
              <p className="text-lg font-bold text-[#f2efff]">{tests.length}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-[#857ca2]">Avg Score</p>
            <p className={`text-lg font-bold ${avgScore >= 70 ? 'text-green-400' : avgScore >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
              {avgScore}%
            </p>
          </div>
        </div>
      </div>

      {/* Test List */}
      <div className="space-y-2">
        <p className="text-xs text-[#857ca2] uppercase tracking-wide px-2">
          Recent Tests
        </p>
        
        {tests.slice().reverse().map((test, idx) => {
          const percentage = Math.round((test.score / test.total) * 100);
          const colors = getScoreColor(percentage);
          const date = new Date(test.created_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
        });
        const time = new Date(test.created_at).toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
        });

        return (
          <motion.button
            key={test.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            whileTap={{ opacity: 0.6, scale: 0.98 }}
            onClick={() => onSelectTest(test.id)}
            className={`w-full text-left p-3 rounded-xl border transition-all overflow-hidden ${colors.bg} ${colors.border} hover:bg-opacity-80`}
          >
            {/* Session Title */}
            {test.sessionTitle && (
              <p className="text-xs text-[#a78bfa] mb-2 truncate max-w-full">
                {test.sessionTitle}
              </p>
            )}
            
            {/* Score and Badge Row */}
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className={`text-base font-bold ${colors.text} truncate`}>
                {test.score}/{test.total} — {percentage}%
              </div>
              <div
                className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold text-white ${colors.badge}`}
              >
                {percentage >= 70 ? "Pass" : percentage >= 50 ? "Fair" : "Fail"}
              </div>
            </div>
            
            {/* Date/Time Row */}
            <div className="flex items-center gap-1.5 text-[11px] text-[#857ca2]">
              <ClockIcon className="w-3 h-3 shrink-0" />
              <span className="truncate">{date} • {time}</span>
              <span className="shrink-0">• {test.total}Q</span>
            </div>
          </motion.button>
        );
      })}
      </div>
    </div>
  );
}
