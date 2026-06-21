"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronLeft, X, Clock, Loader2, Check } from "lucide-react";
import { BottomSheet } from "./BottomSheet";
import { useState, useEffect, useRef } from "react";
import { Aawax } from "./mascot/Aawax";
import { useMascot } from "@/lib/mascot/MascotContext";

interface Question {
  question?: string;
  statement?: string;
  options?: string[];
  answer?: string | boolean;
}

interface TestScreenProps {
  questions: Question[];
  questionType: "mcq" | "tf" | "sa";
  currentIndex: number;
  totalQuestions: number;
  answer?: string;
  onAnswer: (value: string) => void;
  onPrevious: () => void;
  onNext: () => void;
  onExit: () => void;
  isLastQuestion: boolean;
  onSubmit: () => void;
  timerMinutes?: number | null;
}

const TYPE_LABEL: Record<TestScreenProps["questionType"], string> = {
  mcq: "Multiple choice",
  tf: "True or false",
  sa: "Short answer",
};

export function TestScreen({
  questions,
  questionType,
  currentIndex,
  totalQuestions,
  answer,
  onAnswer,
  onPrevious,
  onNext,
  onExit,
  isLastQuestion,
  onSubmit,
  timerMinutes,
}: TestScreenProps) {
  const { design, color } = useMascot();
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(timerMinutes ? timerMinutes * 60 : null);
  const [timeIsUp, setTimeIsUp] = useState(false);

  const onSubmitRef = useRef(onSubmit);
  onSubmitRef.current = onSubmit;

  const question = questions[currentIndex];
  const progress = ((currentIndex + 1) / totalQuestions) * 100;
  const answered = answer !== undefined && answer !== "";

  useEffect(() => {
    if (timeLeft === null) return;
    if (timeLeft <= 0) {
      setTimeIsUp(true);
      const timeout = setTimeout(() => onSubmitRef.current(), 1500);
      return () => clearTimeout(timeout);
    }
    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft]);

  const getTimerColor = () => {
    if (timeLeft === null || !timerMinutes) return "text-green-400";
    const percentRemaining = (timeLeft / (timerMinutes * 60)) * 100;
    if (timeLeft <= 10) return "text-red-400";
    if (percentRemaining < 50) return "text-yellow-400";
    return "text-green-400";
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleAnswer = (value: string) => {
    if (submitting) return;
    onAnswer(value);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await onSubmit();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex flex-col bg-[#06060b] text-white">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div
          className="absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full blur-3xl"
          style={{ background: "rgba(var(--accent-glow), 0.12)" }}
        />
      </div>

      {/* Header */}
      <div className="border-b border-white/[0.06] bg-[#06060b]/85 backdrop-blur-xl">
        <div className="mx-auto w-full max-w-2xl px-4 pt-[calc(0.75rem+env(safe-area-inset-top))] pb-3">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-full"
                style={{ background: "rgba(var(--accent-glow), 0.12)" }}
              >
                <Aawax design={design} color={color} mood={answered ? "cheer" : "think"} size={30} float={false} />
              </span>
              <div className="leading-tight">
                <p className="text-sm font-semibold text-white">Question {currentIndex + 1}</p>
                <p className="text-[11px] uppercase tracking-wider text-white/40">of {totalQuestions}</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              {timeLeft !== null && (
                <div
                  className={`flex items-center gap-1.5 rounded-full border bg-white/5 px-3 py-1.5 ${
                    timeLeft <= 10 ? "border-red-500/50" : "border-white/10"
                  }`}
                >
                  <Clock className={`h-3.5 w-3.5 ${getTimerColor()}`} />
                  <span className={`font-mono text-sm font-bold ${getTimerColor()}`}>
                    {timeIsUp ? "Time up" : formatTime(timeLeft)}
                  </span>
                </div>
              )}
              <button
                onClick={() => setShowExitConfirm(true)}
                disabled={submitting}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-white/60 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-40 cursor-pointer"
                aria-label="Exit test"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Progress */}
          <div className="h-2 overflow-hidden rounded-full bg-white/[0.08]">
            <motion.div
              className="h-full rounded-full"
              style={{ background: "linear-gradient(90deg, var(--accent-soft), var(--accent))" }}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.35, ease: "easeOut" }}
            />
          </div>
        </div>
      </div>

      {/* Question */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-2xl px-4 py-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              <span
                className="text-[11px] font-bold uppercase tracking-[0.22em]"
                style={{ color: "var(--accent-soft)" }}
              >
                {TYPE_LABEL[questionType]}
              </span>
              <h2 className="mb-6 mt-2 font-serif text-2xl leading-snug text-white">
                {question?.question || question?.statement}
              </h2>

              {questionType === "mcq" && (
                <div className="space-y-2.5">
                  {question?.options?.map((option, idx) => {
                    const letter = option.trim().charAt(0).toUpperCase();
                    const isSelected = answer === letter;
                    return (
                      <motion.button
                        key={idx}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleAnswer(letter)}
                        disabled={submitting}
                        className="flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition-colors disabled:cursor-not-allowed cursor-pointer"
                        style={{
                          borderColor: isSelected ? "var(--accent)" : "rgba(255,255,255,0.1)",
                          background: isSelected ? "rgba(var(--accent-glow), 0.14)" : "rgba(255,255,255,0.03)",
                        }}
                      >
                        <span
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                          style={{
                            background: isSelected
                              ? "linear-gradient(135deg, var(--accent-soft), var(--accent))"
                              : "rgba(255,255,255,0.06)",
                            color: isSelected ? "#0a0a12" : "rgba(255,255,255,0.6)",
                          }}
                        >
                          {isSelected ? <Check className="h-4 w-4" strokeWidth={3} /> : letter}
                        </span>
                        <span className="text-sm text-white/90">{option}</span>
                      </motion.button>
                    );
                  })}
                </div>
              )}

              {questionType === "tf" && (
                <div className="grid grid-cols-2 gap-3">
                  {["True", "False"].map((option) => {
                    const isSelected = answer === option;
                    return (
                      <motion.button
                        key={option}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => handleAnswer(option)}
                        disabled={submitting}
                        className="min-h-[64px] rounded-2xl border text-base font-semibold transition-colors disabled:cursor-not-allowed cursor-pointer"
                        style={{
                          borderColor: isSelected ? "transparent" : "rgba(255,255,255,0.1)",
                          background: isSelected
                            ? "linear-gradient(135deg, var(--accent-soft), var(--accent))"
                            : "rgba(255,255,255,0.03)",
                          color: isSelected ? "#0a0a12" : "rgba(255,255,255,0.8)",
                        }}
                      >
                        {option}
                      </motion.button>
                    );
                  })}
                </div>
              )}

              {questionType === "sa" && (
                <textarea
                  value={answer || ""}
                  onChange={(e) => onAnswer(e.target.value)}
                  placeholder="Type your answer here..."
                  disabled={submitting}
                  className="min-h-[170px] w-full resize-none rounded-2xl border border-white/[0.08] bg-black/30 px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 disabled:opacity-50"
                  style={{ ["--tw-ring-color" as string]: "var(--accent)", lineHeight: "1.7" }}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom navigation */}
      <div className="border-t border-white/[0.06] bg-[#0b0b12]/90 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-2xl items-center gap-3 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
          <button
            onClick={onPrevious}
            disabled={currentIndex === 0 || submitting}
            className="btn-outline flex-1 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-5 w-5" /> Previous
          </button>
          <motion.button
            whileTap={{ scale: submitting ? 1 : 0.97 }}
            onClick={isLastQuestion ? handleSubmit : onNext}
            disabled={submitting}
            className="btn-primary flex-1"
          >
            {submitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" /> Submitting...
              </>
            ) : isLastQuestion ? (
              "Submit test"
            ) : (
              <>
                Next <ChevronRight className="h-5 w-5" />
              </>
            )}
          </motion.button>
        </div>
      </div>

      {/* Exit confirmation */}
      <BottomSheet isOpen={showExitConfirm} onClose={() => setShowExitConfirm(false)}>
        <div className="py-4">
          <h3 className="mb-2 font-serif text-2xl text-white">Exit test?</h3>
          <p className="mb-6 text-sm text-white/55">Your progress on this test will be lost.</p>
          <div className="flex gap-3">
            <button onClick={() => setShowExitConfirm(false)} className="btn-outline flex-1">
              Cancel
            </button>
            <button
              onClick={() => {
                setShowExitConfirm(false);
                onExit();
              }}
              className="flex-1 rounded-full bg-red-500 py-3 font-bold text-white transition-colors hover:bg-red-600 cursor-pointer"
            >
              Exit
            </button>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}
