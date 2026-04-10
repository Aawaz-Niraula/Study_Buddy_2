"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, CheckCircle2 } from "lucide-react";
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
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const getAnswerText = (data: Question) =>
    data.answer ?? data.expected_answer ?? data.expectedAnswer ?? data.back ?? "No answer provided";

  const getNormalizedAnswer = (data: Question) =>
    getAnswerText(data).trim().toUpperCase();

  const isCorrectMcqOption = (option: string, idx: number, data: Question) => {
    const norm = getNormalizedAnswer(data);
    const letter = String.fromCharCode(65 + idx);
    const optionNorm = option.trim().toUpperCase();
    if (norm === letter || norm === `${letter})`) return true;
    if (norm === optionNorm) return true;
    if (optionNorm.startsWith(`${letter})`)) return norm === letter || norm === `${letter})`;
    return optionNorm.includes(norm);
  };

  const isCorrectTrueFalse = (option: "True" | "False", data: Question) =>
    getNormalizedAnswer(data) === option.toUpperCase();

  const allQuestions: Array<{ type: string; data: Question; key: string }> = [];
  questions.multiple_choice?.forEach((q, i) =>
    allQuestions.push({ type: "Multiple Choice", data: q, key: `mcq-${i}` })
  );
  questions.true_false?.forEach((q, i) =>
    allQuestions.push({ type: "True/False", data: q, key: `tf-${i}` })
  );
  questions.short_answer?.forEach((q, i) =>
    allQuestions.push({ type: "Short Answer", data: q, key: `sa-${i}` })
  );
  questions.flashcards?.forEach((q, i) =>
    allQuestions.push({ type: "Flashcard", data: q, key: `fc-${i}` })
  );

  if (allQuestions.length === 0) return null;

  const modeLabel =
    mode === "mix" ? "Mixed" : mode.replace("-", " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="mt-8 space-y-4 w-full">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <h3 className="text-base font-bold text-[#f2efff]">
          Questions
          <span className="ml-2 text-sm font-normal text-[#857ca2]">
            ({allQuestions.length})
          </span>
        </h3>
        <div className="flex items-center gap-1.5 text-xs">
          <span className="px-2.5 py-1 bg-[#a78bfa]/15 border border-[#a78bfa]/25 rounded-full text-[#a78bfa] font-semibold uppercase tracking-wide">
            {difficulty}
          </span>
          <span className="px-2.5 py-1 bg-white/[0.04] border border-white/10 rounded-full text-[#857ca2] uppercase tracking-wide">
            {modeLabel}
          </span>
        </div>
      </div>

      {/* Cards */}
      <div className="space-y-3">
        {allQuestions.map(({ type, data, key }, index) => {
          const isRevealed = revealedAnswers.has(key);
          const showExpandedAnswer = isRevealed && (type === "Short Answer" || type === "Flashcard");

          return (
            <motion.article
              key={key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04, duration: 0.3 }}
              className="bg-white/[0.04] border border-white/10 rounded-2xl overflow-hidden"
            >
              <div className="p-4 sm:p-5">
                {/* Badge row */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2 py-0.5 bg-[#a78bfa]/10 border border-[#a78bfa]/20 rounded text-[10px] font-bold text-[#a78bfa] uppercase tracking-wide">
                    Q{index + 1}
                  </span>
                  <span className="text-[10px] font-medium text-[#857ca2] uppercase tracking-wide">
                    {type}
                  </span>
                </div>

                {/* Question text */}
                <p className="text-[#f2efff] text-sm sm:text-base leading-relaxed mb-4">
                  {data.question || data.statement || data.front}
                </p>

                {/* MCQ options */}
                {type === "Multiple Choice" && data.options && (
                  <div className="space-y-2 mb-4">
                    {data.options.map((option, idx) => {
                      const correct = isRevealed && isCorrectMcqOption(option, idx, data);
                      return (
                        <div
                          key={idx}
                          className={`flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-colors ${
                            correct
                              ? "bg-[#22c55e]/10 border border-[#22c55e]/30 text-[#f2efff]"
                              : "bg-white/[0.03] border border-white/[0.07] text-[#ddd6fe]"
                          }`}
                        >
                          <span>{option}</span>
                          {correct && (
                            <CheckCircle2 className="w-4 h-4 text-[#22c55e] shrink-0" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* True/False options */}
                {type === "True/False" && (
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {(["True", "False"] as const).map((option) => {
                      const correct = isRevealed && isCorrectTrueFalse(option, data);
                      return (
                        <div
                          key={option}
                          className={`flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl text-sm transition-colors ${
                            correct
                              ? "bg-[#22c55e]/10 border border-[#22c55e]/30 text-[#f2efff]"
                              : "bg-white/[0.03] border border-white/[0.07] text-[#ddd6fe]"
                          }`}
                        >
                          <span>{option}</span>
                          {correct && (
                            <CheckCircle2 className="w-4 h-4 text-[#22c55e] shrink-0" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Reveal button */}
                <motion.button
                  whileTap={{ scale: 0.96, opacity: 0.8 }}
                  onClick={() => toggleAnswer(key)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#a78bfa] to-[#f9a8d4] text-white rounded-xl text-xs font-bold uppercase tracking-wide shadow-md"
                >
                  {isRevealed
                    ? type === "Short Answer"
                      ? "Hide Answer"
                      : "Hide"
                    : type === "Short Answer"
                      ? "Show Answer"
                      : "Reveal"}
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      isRevealed ? "rotate-180" : ""
                    }`}
                  />
                </motion.button>
              </div>

              {/* Answer panel for Short Answer / Flashcard */}
              <AnimatePresence initial={false}>
                {showExpandedAnswer && (
                  <motion.div
                    key="answer"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-white/[0.07] bg-[#22c55e]/[0.05] px-4 sm:px-5 py-4">
                      <p className="text-[10px] font-bold text-[#22c55e] uppercase tracking-widest mb-1.5">
                        {type === "Short Answer" ? "Expected answer" : "Answer"}
                      </p>
                      <p className="text-[#f2efff] text-sm leading-relaxed">
                        {getAnswerText(data)}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.article>
          );
        })}
      </div>
    </div>
  );
}