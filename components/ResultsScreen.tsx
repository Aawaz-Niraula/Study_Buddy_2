"use client";

import { motion } from "framer-motion";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";

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
}

export function ResultsScreen({
  score,
  total,
  questions,
  onRetakeTest,
  onNewSession,
}: ResultsScreenProps) {
  const percentage = Math.round((score / total) * 100);

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
    if (correct === true) return "bg-green-500/10";
    if (correct === false) return "bg-red-500/10";
    return "bg-yellow-500/10";
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#06060b] via-[#0b0b12] to-[#11111a] text-[#f2efff] py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Score Circle */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", duration: 0.8 }}
          className="w-48 h-48 mx-auto mb-8"
        >
          <CircularProgressbar
            value={percentage}
            text={`${percentage}%`}
            styles={buildStyles({
              pathColor: getScoreColor(),
              textColor: "#f2efff",
              trailColor: "rgba(255,255,255,0.1)",
              textSize: "24px",
            })}
          />
        </motion.div>

        {/* Score Text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold mb-2" style={{ color: getScoreColor() }}>
            {score} / {total}
          </h2>
          <p className="text-[#857ca2]">
            {percentage >= 70
              ? "Great job! You passed!"
              : percentage >= 50
              ? "Not bad! Keep practicing."
              : "Keep studying and try again!"}
          </p>
        </motion.div>

        {/* Question Review */}
        <div className="space-y-4 mb-8">
          {questions.map((q, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + idx * 0.1 }}
              className={`bg-white/5 border-2 rounded-2xl p-5 ${getBorderColor(q.correct)} ${getBgColor(q.correct)}`}
            >
              {/* Question Number & Status */}
              <div className="flex items-start justify-between mb-3">
                <span className="text-xs text-[#857ca2] uppercase tracking-wide">
                  Question {idx + 1}
                </span>
                {q.correct === true && <CheckCircle className="w-5 h-5 text-green-400" />}
                {q.correct === false && <XCircle className="w-5 h-5 text-red-400" />}
                {q.correct === undefined && <AlertCircle className="w-5 h-5 text-yellow-400" />}
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

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex gap-4 sticky bottom-4"
        >
          <motion.button
            whileTap={{ opacity: 0.6 }}
            onClick={onRetakeTest}
            className="flex-1 min-h-[56px] px-6 py-4 rounded-2xl border-2 border-white/20 text-[#ddd6fe] font-bold hover:bg-white/5 transition-colors"
          >
            RETAKE TEST
          </motion.button>
          <motion.button
            whileTap={{ opacity: 0.6 }}
            onClick={onNewSession}
            className="flex-1 min-h-[56px] px-6 py-4 rounded-2xl bg-gradient-to-r from-[#a78bfa] to-[#f9a8d4] text-white font-bold"
          >
            NEW SESSION
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
