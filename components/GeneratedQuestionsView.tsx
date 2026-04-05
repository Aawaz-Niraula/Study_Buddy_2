"use client";

import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

interface Question {
  question?: string;
  statement?: string;
  answer?: string;
  options?: string[];
  front?: string;
  back?: string;
}

interface QuestionSet {
  multiple_choice?: Question[];
  short_answer?: Question[];
  true_false?: Question[];
  flashcards?: Question[];
}

interface GeneratedQuestionsViewProps {
  questions: QuestionSet;
  difficulty: string;
  mode: string;
}

export function GeneratedQuestionsView({
  questions,
  difficulty,
  mode,
}: GeneratedQuestionsViewProps) {
  const [revealedAnswers, setRevealedAnswers] = useState<Set<string>>(new Set());

  const toggleAnswer = (key: string) => {
    setRevealedAnswers((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  const allQuestions: Array<{ type: string; data: Question; key: string }> = [];

  if (questions.multiple_choice) {
    questions.multiple_choice.forEach((q, i) =>
      allQuestions.push({ type: "Multiple Choice", data: q, key: `mcq-${i}` })
    );
  }
  if (questions.true_false) {
    questions.true_false.forEach((q, i) =>
      allQuestions.push({ type: "True/False", data: q, key: `tf-${i}` })
    );
  }
  if (questions.short_answer) {
    questions.short_answer.forEach((q, i) =>
      allQuestions.push({ type: "Short Answer", data: q, key: `sa-${i}` })
    );
  }
  if (questions.flashcards) {
    questions.flashcards.forEach((q, i) =>
      allQuestions.push({ type: "Flashcard", data: q, key: `fc-${i}` })
    );
  }

  if (allQuestions.length === 0) {
    return null;
  }

  return (
    <div className="mt-8 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between px-2">
        <h3 className="text-lg font-bold text-[#f2efff]">
          Generated Questions ({allQuestions.length})
        </h3>
        <div className="flex items-center gap-2 text-xs">
          <span className="px-3 py-1 bg-[#a78bfa]/20 border border-[#a78bfa]/30 rounded-full text-[#a78bfa] font-medium">
            {difficulty.toUpperCase()}
          </span>
          <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[#857ca2]">
            {mode === "mix" ? "MIXED" : mode.toUpperCase().replace("-", " ")}
          </span>
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-3">
        {allQuestions.map(({ type, data, key }, index) => {
          const isRevealed = revealedAnswers.has(key);

          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden"
            >
              {/* Question Header */}
              <div className="p-5">
                <div className="flex items-start gap-3 mb-3">
                  <span className="px-2 py-1 bg-[#a78bfa]/10 border border-[#a78bfa]/20 rounded text-xs text-[#a78bfa] font-medium">
                    Q{index + 1}
                  </span>
                  <span className="text-xs text-[#857ca2]">{type}</span>
                </div>

                {/* Question Text */}
                <p className="text-[#f2efff] leading-relaxed mb-4">
                  {data.question || data.statement || data.front}
                </p>

                {/* Options (for MCQ) */}
                {type === "Multiple Choice" && data.options && (
                  <div className="space-y-2 mb-4">
                    {data.options.map((option, idx) => (
                      <div
                        key={idx}
                        className="px-4 py-2 bg-white/5 rounded-lg text-sm text-[#ddd6fe]"
                      >
                        {option}
                      </div>
                    ))}
                  </div>
                )}

                {/* Reveal Button */}
                <motion.button
                  whileTap={{ opacity: 0.6 }}
                  onClick={() => toggleAnswer(key)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#a78bfa] to-[#f9a8d4] text-white rounded-xl text-sm font-medium"
                >
                  {isRevealed ? "Hide Answer" : "Reveal Answer"}
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${
                      isRevealed ? "rotate-180" : ""
                    }`}
                  />
                </motion.button>
              </div>

              {/* Answer (revealed) */}
              {isRevealed && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="border-t border-white/10 bg-[#22c55e]/5 p-5"
                >
                  <div className="flex items-start gap-2">
                    <span className="text-xs font-medium text-[#22c55e] uppercase tracking-wide">
                      Answer:
                    </span>
                    <span className="text-[#f2efff] leading-relaxed flex-1">
                      {((data as any).answer ?? (data as any).expected_answer ?? (data as any).expectedAnswer ?? (data as any).back) || "No answer provided"}
                    </span>
                  </div>
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
