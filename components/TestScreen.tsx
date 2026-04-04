"use client";

import { motion } from "framer-motion";
import { ArrowLeft, ChevronRight, ChevronLeft, X, Clock } from "lucide-react";
import { BottomSheet } from "./BottomSheet";
import { useState, useEffect, useRef, useCallback } from "react";

interface Question {
  question?: string;
  statement?: string;
  options?: string[];
  answer?: string;
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
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(
    timerMinutes ? timerMinutes * 60 : null
  );
  const [timeIsUp, setTimeIsUp] = useState(false);
  
  // Use ref for onSubmit to avoid re-renders
  const onSubmitRef = useRef(onSubmit);
  onSubmitRef.current = onSubmit;

  const question = questions[currentIndex];
  const progress = ((currentIndex + 1) / totalQuestions) * 100;

  // Timer logic - using ref to avoid dependency issues
  useEffect(() => {
    if (timeLeft === null) return;

    if (timeLeft <= 0) {
      setTimeIsUp(true);
      // Show "Time is up!" briefly, then auto-submit
      const timeout = setTimeout(() => {
        onSubmitRef.current();
      }, 1500);
      return () => clearTimeout(timeout);
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft]);

  const getTimerColor = () => {
    if (timeLeft === null || !timerMinutes) return "text-green-400";
    
    const totalSeconds = timerMinutes * 60;
    const percentRemaining = (timeLeft / totalSeconds) * 100;

    if (timeLeft <= 10) return "text-red-400";
    if (percentRemaining < 50) return "text-yellow-400";
    return "text-green-400";
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleExit = () => {
    setShowExitConfirm(true);
  };

  const confirmExit = () => {
    setShowExitConfirm(false);
    onExit();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#06060b] via-[#0b0b12] to-[#11111a] text-[#f2efff] pb-24">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-30 bg-[#06060b]/80 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs text-[#857ca2] uppercase tracking-wider">
              Test Mode
            </div>
            <div className="flex items-center gap-3">
              {/* Timer Display */}
              {timeLeft !== null && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border ${
                    timeLeft <= 10 ? "border-red-500/50" : "border-white/10"
                  }`}
                >
                  <Clock className={`w-4 h-4 ${getTimerColor()}`} />
                  <span className={`text-sm font-mono font-bold ${getTimerColor()}`}>
                    {timeIsUp ? "Time is up!" : formatTime(timeLeft)}
                  </span>
                </motion.div>
              )}
              
              <motion.button
                whileTap={{ opacity: 0.6 }}
                onClick={handleExit}
                className="p-2 rounded-full hover:bg-white/5 transition-colors"
                aria-label="Exit test"
              >
                <X className="w-5 h-5 text-[#f87171]" />
              </motion.button>
            </div>
          </div>

          {/* Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#ddd6fe] font-medium">
                Q{currentIndex + 1} of {totalQuestions}
              </span>
              <span className="text-[#857ca2]">{Math.round(progress)}%</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
                className="h-full bg-gradient-to-r from-[#a78bfa] to-[#f9a8d4]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Question Content */}
      <div className="pt-32 px-4 pb-8 max-w-3xl mx-auto">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6"
        >
          {/* Question Text */}
          <h2 className="text-xl leading-relaxed mb-6 text-[#f2efff]">
            {question?.question || question?.statement}
          </h2>

          {/* Answer Input */}
          {questionType === "mcq" && (
            <div className="space-y-3">
              {question?.options?.map((option, idx) => {
                const letter = option.trim().charAt(0).toUpperCase();
                const isSelected = answer === letter;

                return (
                  <motion.button
                    key={idx}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onAnswer(letter)}
                    className={`w-full text-left p-4 rounded-xl transition-all ${
                      isSelected
                        ? "bg-[#a78bfa]/20 border-[#a78bfa]/50 border-2"
                        : "bg-white/5 border border-white/10 hover:bg-white/8"
                    }`}
                  >
                    <div className="text-[#f2efff]">{option}</div>
                  </motion.button>
                );
              })}
            </div>
          )}

          {questionType === "tf" && (
            <div className="flex gap-4">
              {["True", "False"].map((option) => {
                const isSelected = answer === option;

                return (
                  <motion.button
                    key={option}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onAnswer(option)}
                    className={`flex-1 min-h-[56px] px-6 py-4 rounded-xl font-medium transition-all ${
                      isSelected
                        ? "bg-gradient-to-r from-[#a78bfa] to-[#f9a8d4] text-white"
                        : "bg-white/5 border border-white/10 text-[#ddd6fe] hover:bg-white/8"
                    }`}
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
              className="w-full min-h-[160px] bg-[#11111a] border-none rounded-xl px-4 py-3 text-[#f2efff] resize-none focus:outline-none focus:ring-2 focus:ring-[#a78bfa]/40 placeholder-[#857ca2]"
              style={{ fontFamily: "inherit", lineHeight: "1.7" }}
            />
          )}
        </motion.div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0b0b12] border-t border-white/10 p-4">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <motion.button
            whileTap={{ opacity: 0.6 }}
            onClick={onPrevious}
            disabled={currentIndex === 0}
            className={`flex-1 min-h-[48px] px-6 py-3 rounded-xl font-medium border transition-all ${
              currentIndex === 0
                ? "border-white/10 text-[#857ca2] opacity-50 cursor-not-allowed"
                : "border-white/20 text-[#ddd6fe] hover:bg-white/5"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <ChevronLeft className="w-5 h-5" />
              PREVIOUS
            </div>
          </motion.button>

          <motion.button
            whileTap={{ opacity: 0.6 }}
            onClick={isLastQuestion ? onSubmit : onNext}
            className="flex-1 min-h-[48px] px-6 py-3 rounded-xl font-bold bg-gradient-to-r from-[#a78bfa] to-[#f9a8d4] text-white"
          >
            <div className="flex items-center justify-center gap-2">
              {isLastQuestion ? "SUBMIT TEST" : "NEXT"}
              {!isLastQuestion && <ChevronRight className="w-5 h-5" />}
            </div>
          </motion.button>
        </div>
      </div>

      {/* Exit Confirmation */}
      <BottomSheet isOpen={showExitConfirm} onClose={() => setShowExitConfirm(false)}>
        <div className="py-4">
          <h3 className="text-xl font-bold text-[#f2efff] mb-3">Exit Test?</h3>
          <p className="text-[#857ca2] mb-6">
            Are you sure you want to exit? Your progress will be lost.
          </p>
          <div className="flex gap-3">
            <motion.button
              whileTap={{ opacity: 0.6 }}
              onClick={() => setShowExitConfirm(false)}
              className="flex-1 min-h-[48px] px-6 py-3 rounded-xl border border-white/20 text-[#ddd6fe] font-medium"
            >
              Cancel
            </motion.button>
            <motion.button
              whileTap={{ opacity: 0.6 }}
              onClick={confirmExit}
              className="flex-1 min-h-[48px] px-6 py-3 rounded-xl bg-[#f87171] text-white font-bold"
            >
              Exit
            </motion.button>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}
