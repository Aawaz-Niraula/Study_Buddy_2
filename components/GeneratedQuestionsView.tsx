"use client";

import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

interface Question {
  question?: string;
  statement?: string;
  answer?: string;
  expected_answer?: string;
  expectedAnswer?: string;
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

  const getAnswerText = (data: Question) =>
    data.answer ?? data.expected_answer ?? data.expectedAnswer ?? data.back ?? "No answer provided";

  const getNormalizedAnswer = (data: Question) =>
    getAnswerText(data).trim().toUpperCase();

  const isCorrectMcqOption = (option: string, idx: number, data: Question) => {
    const normalizedAnswer = getNormalizedAnswer(data);
    const letter = String.fromCharCode(65 + idx);
    const normalizedOption = option.trim().toUpperCase();

    if (normalizedAnswer === letter || normalizedAnswer === `${letter})`) return true;
    if (normalizedAnswer === normalizedOption) return true;
    if (normalizedOption.startsWith(`${letter})`)) {
      return normalizedAnswer === letter || normalizedAnswer === `${letter})`;
    }
    return normalizedOption.includes(normalizedAnswer);
  };

  const isCorrectTrueFalseOption = (option: "True" | "False", data: Question) =>
    getNormalizedAnswer(data) === option.toUpperCase();

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
              <div className="p-5">
                <div className="flex items-start gap-3 mb-3">
                  <span className="px-2 py-1 bg-[#a78bfa]/10 border border-[#a78bfa]/20 rounded text-xs text-[#a78bfa] font-medium">
                    Q{index + 1}
                  </span>
                  <span className="text-xs text-[#857ca2]">{type}</span>
                </div>

                <p className="text-[#f2efff] leading-relaxed mb-4">
                  {data.question || data.statement || data.front}
                </p>

                {type === "Multiple Choice" && data.options && (
                  <div className="space-y-2 mb-4">
                    {data.options.map((option, idx) => {
                      const isCorrect = isRevealed && isCorrectMcqOption(option, idx, data);
                      return (
                        <div
                          key={idx}
                          className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                            isCorrect
                              ? "bg-[#22c55e]/12 border border-[#22c55e]/30 text-[#f2efff]"
                              : "bg-white/5 text-[#ddd6fe]"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span>{option}</span>
                            {isCorrect && (
                              <span className="text-[11px] font-semibold uppercase tracking-wide text-[#22c55e]">
                                Correct
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {type === "True/False" && (
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {(["True", "False"] as const).map((option) => {
                      const isCorrect = isRevealed && isCorrectTrueFalseOption(option, data);
                      return (
                        <div
                          key={option}
                          className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                            isCorrect
                              ? "bg-[#22c55e]/12 border border-[#22c55e]/30 text-[#f2efff]"
                              : "bg-white/5 text-[#ddd6fe]"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span>{option}</span>
                            {isCorrect && (
                              <span className="text-[11px] font-semibold uppercase tracking-wide text-[#22c55e]">
                                Correct
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <motion.button
                  whileTap={{ opacity: 0.6 }}
                  onClick={() => toggleAnswer(key)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#a78bfa] to-[#f9a8d4] text-white rounded-xl text-sm font-medium"
                >
                  {isRevealed
                    ? type === "Short Answer"
                      ? "Hide Expected Answer"
                      : "Hide Answer"
                    : type === "Short Answer"
                      ? "Show Expected Answer"
                      : "Reveal Answer"}
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${
                      isRevealed ? "rotate-180" : ""
                    }`}
                  />
                </motion.button>
              </div>

              {isRevealed && (type === "Short Answer" || type === "Flashcard") && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="border-t border-white/10 bg-[#22c55e]/5 p-5"
                >
                  <div className="flex items-start gap-2">
                    <span className="text-xs font-medium text-[#22c55e] uppercase tracking-wide">
                      {type === "Short Answer" ? "Expected answer:" : "Answer:"}
                    </span>
                    <span className="text-[#f2efff] leading-relaxed flex-1">
                      {getAnswerText(data)}
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
