"use client";

import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle, XCircle, Sparkles } from "lucide-react";

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
  onAskAawax?: (question: string) => void;
}

export function TestReviewScreen({ questions, score, total, onClose, onAskAawax }: TestReviewScreenProps) {
  const percentage = total ? Math.round((score / total) * 100) : 0;

  const getBorderColor = (correct?: boolean) => {
    if (correct === true) return "border-green-500/40";
    if (correct === false) return "border-red-500/40";
    return "border-yellow-500/40";
  };
  const getBgColor = (correct?: boolean) => {
    if (correct === true) return "bg-green-500/[0.07]";
    if (correct === false) return "bg-red-500/[0.07]";
    return "bg-yellow-500/[0.07]";
  };

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto bg-[#06060b]">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-white/[0.06] bg-[#06060b]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3.5">
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-white/70 transition-colors hover:text-white cursor-pointer"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="font-medium">Back</span>
          </button>
          <div className="text-sm text-white/60">
            <span className="font-bold" style={{ color: "var(--accent-soft)" }}>
              {score}/{total}
            </span>{" "}
            ({percentage}%)
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-2xl px-4 py-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.3em]" style={{ color: "var(--accent-soft)" }}>
          Review
        </p>
        <h1 className="mb-6 mt-1 font-serif text-3xl text-white">Test review</h1>

        <div className="space-y-3.5">
          {questions.map((q, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              className={`rounded-2xl border p-5 ${getBorderColor(q.correct)} ${getBgColor(q.correct)}`}
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-white/45">Question {idx + 1}</span>
                {q.correct === true && <CheckCircle className="h-5 w-5 text-green-400" />}
                {q.correct === false && <XCircle className="h-5 w-5 text-red-400" />}
              </div>

              <h3 className="mb-4 text-base font-medium leading-relaxed text-white">
                {q.question || q.statement}
              </h3>

              {q.userAnswer && (
                <div className="mb-2.5 rounded-xl border border-white/10 bg-white/[0.04] p-3">
                  <div className="mb-1 text-xs text-white/45">Your answer</div>
                  <div className="text-sm text-white/75">{q.userAnswer}</div>
                </div>
              )}

              <div className="rounded-xl border border-green-500/30 bg-green-500/[0.08] p-3">
                <div className="mb-1 text-xs text-green-400">Correct answer</div>
                <div className="text-sm text-green-300">{q.answer}</div>
              </div>

              {q.explanation && (
                <div
                  className="mt-2.5 rounded-xl border p-3"
                  style={{ borderColor: "rgba(var(--accent-glow),0.3)", background: "rgba(var(--accent-glow),0.08)" }}
                >
                  <div className="mb-1 text-xs" style={{ color: "var(--accent-soft)" }}>
                    Explanation
                  </div>
                  <div className="text-sm leading-relaxed text-white/80">{q.explanation}</div>
                </div>
              )}

              {/* Ask Aawax on wrong answers */}
              {q.correct === false && onAskAawax && (
                <button
                  onClick={() => onAskAawax(`${q.question || q.statement}`)}
                  className="mt-3.5 flex w-full items-center justify-center gap-2 rounded-full border py-2.5 text-sm font-semibold transition-colors cursor-pointer"
                  style={{
                    borderColor: "rgba(var(--accent-glow),0.4)",
                    background: "rgba(var(--accent-glow),0.12)",
                    color: "var(--accent-soft)",
                  }}
                >
                  <Sparkles className="h-4 w-4" /> Ask Aawax
                </button>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
