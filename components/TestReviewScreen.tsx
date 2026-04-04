"use client";

import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle, XCircle } from "lucide-react";

interface ReviewQuestion {
  question?: string;
  statement?: string;
  answer: string;
  userAnswer?: string;
  correct?: boolean;
  explanation?: string;
  options?: string[];
}

interface TestReviewScreenProps {
  questions: ReviewQuestion[];
  score: number;
  total: number;
  onClose: () => void;
}

export function TestReviewScreen({
  questions,
  score,
  total,
  onClose,
}: TestReviewScreenProps) {
  const percentage = Math.round((score / total) * 100);

  const getBorderColor = (correct?: boolean) => {
    if (correct === true) return "border-green-500/40";
    if (correct === false) return "border-red-500/40";
    return "border-yellow-500/40";
  };

  const getBgColor = (correct?: boolean) => {
    if (correct === true) return "bg-green-500/10";
    if (correct === false) return "bg-red-500/10";
    return "bg-yellow-500/10";
  };

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-b from-[#06060b] via-[#0b0b12] to-[#11111a] overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#06060b]/80 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <motion.button
              whileTap={{ opacity: 0.6 }}
              onClick={onClose}
              className="flex items-center gap-2 text-[#ddd6fe] hover:text-[#f2efff] transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back</span>
            </motion.button>
            <div className="text-sm">
              <span className="text-[#857ca2]">Score: </span>
              <span className="text-[#f2efff] font-bold">
                {score}/{total} ({percentage}%)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-[#f2efff] mb-6">Test Review</h1>

        <div className="space-y-4">
          {questions.map((q, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`bg-white/5 border-2 rounded-2xl p-5 ${getBorderColor(q.correct)} ${getBgColor(q.correct)}`}
            >
              {/* Question Number & Status */}
              <div className="flex items-start justify-between mb-3">
                <span className="text-xs text-[#857ca2] uppercase tracking-wide">
                  Question {idx + 1}
                </span>
                {q.correct === true && <CheckCircle className="w-5 h-5 text-green-400" />}
                {q.correct === false && <XCircle className="w-5 h-5 text-red-400" />}
              </div>

              {/* Question Text */}
              <h3 className="text-base font-medium text-[#f2efff] mb-4 leading-relaxed">
                {q.question || q.statement}
              </h3>

              {/* User Answer */}
              {q.userAnswer && (
                <div className="mb-3 p-3 bg-white/5 rounded-lg border border-white/10">
                  <div className="text-xs text-[#857ca2] mb-1">Your answer:</div>
                  <div className="text-sm text-[#a59dbd]">{q.userAnswer}</div>
                </div>
              )}

              {/* Correct Answer */}
              <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/30">
                <div className="text-xs text-green-400 mb-1">Correct answer:</div>
                <div className="text-sm text-green-300">{q.answer}</div>
              </div>

              {/* Explanation */}
              {q.explanation && (
                <div className="mt-3 p-3 bg-[#a78bfa]/10 rounded-lg border border-[#a78bfa]/30">
                  <div className="text-xs text-[#a78bfa] mb-1">Explanation:</div>
                  <div className="text-sm text-[#ddd6fe] leading-relaxed">{q.explanation}</div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
