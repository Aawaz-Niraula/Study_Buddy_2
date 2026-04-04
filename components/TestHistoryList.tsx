"use client";

import { motion } from "framer-motion";
import { Trophy, Clock as ClockIcon } from "lucide-react";

export interface TestSubmissionItem {
  id: string;
  created_at: string;
  score: number;
  total: number;
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
        <div className="text-[#857ca2] text-sm">Loading test history...</div>
      </div>
    );
  }

  if (tests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Trophy className="w-12 h-12 text-[#857ca2]/50 mb-3" />
        <p className="text-[#857ca2] text-sm">No tests taken yet</p>
      </div>
    );
  }

  const getScoreColor = (percentage: number) => {
    if (percentage >= 70) return { bg: "bg-green-500/10", border: "border-green-500/40", text: "text-green-400", badge: "bg-green-500" };
    if (percentage >= 50) return { bg: "bg-yellow-500/10", border: "border-yellow-500/40", text: "text-yellow-400", badge: "bg-yellow-500" };
    return { bg: "bg-red-500/10", border: "border-red-500/40", text: "text-red-400", badge: "bg-red-500" };
  };

  return (
    <div className="space-y-3">
      {tests.map((test, idx) => {
        const percentage = Math.round((test.score / test.total) * 100);
        const colors = getScoreColor(percentage);
        const date = new Date(test.created_at).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
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
            className={`w-full text-left p-4 rounded-xl border transition-all ${colors.bg} ${colors.border} hover:bg-opacity-80`}
          >
            <div className="flex items-start justify-between gap-3">
              {/* Content */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <ClockIcon className="w-4 h-4 text-[#857ca2]" />
                  <span className="text-xs text-[#857ca2]">
                    {date} • {time}
                  </span>
                </div>
                <div className={`text-lg font-bold ${colors.text} mb-1`}>
                  {test.score}/{test.total} — {percentage}%
                </div>
              </div>

              {/* Badge */}
              <div
                className={`px-3 py-1 rounded-full text-xs font-medium text-white ${colors.badge}`}
              >
                {percentage >= 70 ? "Pass" : percentage >= 50 ? "Fair" : "Fail"}
              </div>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
