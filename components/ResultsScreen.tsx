"use client";

import { motion } from "framer-motion";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { CheckCircle, XCircle, AlertCircle, RotateCcw, Plus, Sparkles } from "lucide-react";
import { Aawax } from "./mascot/Aawax";
import { useMascot } from "@/lib/mascot/MascotContext";

interface ResultQuestion {
  question?: string;
  statement?: string;
  answer: string;
  userAnswer?: string;
  correct?: boolean;
  explanation?: string;
  options?: string[];
}

interface ResultsScreenProps {
  score: number;
  total: number;
  questions: ResultQuestion[];
  onRetakeTest: () => void;
  onNewSession: () => void;
  onAskAawax?: (question: string) => void;
}

export function ResultsScreen({ score, total, questions, onRetakeTest, onNewSession, onAskAawax }: ResultsScreenProps) {
  const { design, color, playBoop } = useMascot();
  const percentage = total ? Math.round((score / total) * 100) : 0;
  const mood = percentage >= 70 ? "cheer" : percentage >= 50 ? "idle" : "oops";

  const getScoreColor = () => {
    if (percentage >= 70) return "#22c55e";
    if (percentage >= 50) return "#f59e0b";
    return "#f87171";
  };

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
    <div className="min-h-screen bg-[#06060b] text-white">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div
          className="absolute -top-24 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full blur-3xl"
          style={{ background: "rgba(var(--accent-glow), 0.14)" }}
        />
      </div>

      <div className="mx-auto max-w-2xl px-4 py-8 pb-28">
        {/* Aawax + score */}
        <div className="flex flex-col items-center">
          <Aawax design={design} color={color} mood={mood} size={140} glow sparkles={percentage >= 70} interactive onBoop={playBoop} />
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", duration: 0.7, delay: 0.1 }}
            className="mt-2 h-32 w-32"
          >
            <CircularProgressbar
              value={percentage}
              text={`${percentage}%`}
              styles={buildStyles({
                pathColor: getScoreColor(),
                textColor: "#fff",
                trailColor: "rgba(255,255,255,0.08)",
                textSize: "22px",
                pathTransitionDuration: 1,
              })}
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-4 text-center"
          >
            <p className="font-serif text-2xl text-white">
              {score} / {total}
            </p>
            <p className="mt-1 text-sm text-white/55">
              {percentage >= 70
                ? "Great job! Aawax is proud of you."
                : percentage >= 50
                  ? "Not bad! Keep practicing."
                  : "Tough one. Review below and try again."}
            </p>
          </motion.div>
        </div>

        {/* Review */}
        <div className="mt-8 space-y-3.5">
          {questions.map((q, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 + idx * 0.05 }}
              className={`rounded-2xl border p-5 ${getBorderColor(q.correct)} ${getBgColor(q.correct)}`}
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-white/45">Question {idx + 1}</span>
                {q.correct === true && <CheckCircle className="h-5 w-5 text-green-400" />}
                {q.correct === false && <XCircle className="h-5 w-5 text-red-400" />}
                {q.correct === undefined && <AlertCircle className="h-5 w-5 text-yellow-400" />}
              </div>

              <h3 className="mb-4 text-base font-medium leading-relaxed text-white">{q.question || q.statement}</h3>

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

      {/* Sticky actions */}
      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-white/[0.06] bg-[#0b0b12]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-2xl gap-3 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
          <button onClick={onRetakeTest} className="btn-outline flex-1">
            <RotateCcw className="h-4 w-4" /> Retake
          </button>
          <button onClick={onNewSession} className="btn-primary flex-1">
            <Plus className="h-4 w-4" /> New session
          </button>
        </div>
      </div>
    </div>
  );
}
