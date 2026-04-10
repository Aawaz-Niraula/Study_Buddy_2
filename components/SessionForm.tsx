"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  Upload,
  Camera,
  X,
  FileText,
  Image as ImageIcon,
  Minus,
  Plus,
  Loader2,
} from "lucide-react";

interface Attachment {
  id: string;
  name: string;
  type: "pdf" | "image";
}

interface SessionFormProps {
  text: string;
  onTextChange: (value: string) => void;
  attachments: Attachment[];
  onFilesAdded: (event: React.ChangeEvent<HTMLInputElement>, origin: "upload" | "camera") => void;
  onRemoveAttachment: (id: string) => void;
  difficulty: "easy" | "medium" | "difficult";
  onDifficultyChange: (value: "easy" | "medium" | "difficult") => void;
  mode: string;
  onModeChange: (value: string) => void;
  questionCount: number;
  onQuestionCountChange: (value: number) => void;
  onGenerate: () => void;
  loading: boolean;
  uploading?: boolean;
  error: string;
  uploadStatus: string;
}

const difficultyOptions = ["easy", "medium", "difficult"] as const;
const formatOptions = [
  { value: "mix", label: "Mixed" },
  { value: "multiple-choice", label: "MCQ" },
  { value: "short-answer", label: "Short Answer" },
  { value: "true-false", label: "True/False" },
  { value: "flashcard", label: "Flashcards" },
];

const difficultyColor: Record<string, string> = {
  easy: "from-[#34d399] to-[#059669]",
  medium: "from-[#a78bfa] to-[#f9a8d4]",
  difficult: "from-[#f87171] to-[#f9a8d4]",
};

export function SessionForm({
  text,
  onTextChange,
  attachments,
  onFilesAdded,
  onRemoveAttachment,
  difficulty,
  onDifficultyChange,
  mode,
  onModeChange,
  questionCount,
  onQuestionCountChange,
  onGenerate,
  loading,
  uploading,
  error,
  uploadStatus,
}: SessionFormProps) {
  const [step2Expanded, setStep2Expanded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const hasInput = text.trim() || attachments.length > 0;
  const isDisabled = loading || uploading;

  useEffect(() => {
    if (hasInput && !step2Expanded) {
      const timer = setTimeout(() => setStep2Expanded(true), 100);
      return () => clearTimeout(timer);
    }
  }, [hasInput, step2Expanded]);

  return (
    <div className="space-y-3 max-w-2xl mx-auto w-full">
      {/* ── Step 1: Input ──────────────────────────────────────────── */}
      <section className="bg-white/[0.04] border border-white/10 rounded-2xl overflow-hidden">
        <div className="p-4 sm:p-6">
          {/* Step header */}
          <div className="flex items-center gap-2.5 mb-4">
            <span className="w-7 h-7 rounded-full bg-gradient-to-br from-[#a78bfa] to-[#f9a8d4] flex items-center justify-center text-white font-bold text-xs shrink-0">
              1
            </span>
            <h3 className="text-xs font-semibold text-[#f2efff] uppercase tracking-widest">
              Input
            </h3>
          </div>

          {/* Textarea */}
          <textarea
            value={text}
            onChange={(e) => onTextChange(e.target.value)}
            placeholder="Paste your notes here…"
            disabled={isDisabled}
            rows={5}
            className="w-full bg-[#0d0d18]/60 border border-white/[0.07] rounded-xl px-4 py-3 text-[#f2efff] text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#f9a8d4]/40 focus:border-[#a78bfa]/50 placeholder-[#5a5270] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 glass-panel"
            style={{ fontFamily: "inherit" }}
          />

          {/* Upload buttons */}
          <div className="grid grid-cols-2 gap-2 mt-3">
            <motion.button
              whileTap={{ scale: isDisabled ? 1 : 0.96 }}
              onClick={() => !isDisabled && fileInputRef.current?.click()}
              disabled={isDisabled}
              className="h-11 px-3 bg-white/[0.04] border border-white/10 rounded-full text-sm font-medium text-[#ddd6fe] hover:bg-white/[0.07] active:bg-white/10 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <Loader2 className="w-4 h-4 animate-spin shrink-0" />
              ) : (
                <Upload className="w-4 h-4 shrink-0" />
              )}
              <span className="truncate">{uploading ? "Uploading…" : "Add Files"}</span>
            </motion.button>

            <motion.button
              whileTap={{ scale: isDisabled ? 1 : 0.96 }}
              onClick={() => !isDisabled && cameraInputRef.current?.click()}
              disabled={isDisabled}
              className="h-11 px-3 bg-white/[0.04] border border-white/10 rounded-full text-sm font-medium text-[#ddd6fe] hover:bg-white/[0.07] active:bg-white/10 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Camera className="w-4 h-4 shrink-0" />
              <span className="truncate">Take Photo</span>
            </motion.button>
          </div>

          {/* Hidden inputs */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,image/*"
            onChange={(e) => onFilesAdded(e, "upload")}
            className="hidden"
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => onFilesAdded(e, "camera")}
            className="hidden"
          />

          {/* File chips */}
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {attachments.map((attachment) => (
                <motion.div
                  key={attachment.id}
                  initial={{ opacity: 0, scale: 0.88 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.88 }}
                  className="flex items-center gap-1.5 pl-2.5 pr-1.5 py-1.5 bg-[#a78bfa]/10 border border-[#a78bfa]/25 rounded-full text-sm max-w-[200px]"
                >
                  {attachment.type === "pdf" ? (
                    <FileText className="w-3.5 h-3.5 text-[#a78bfa] shrink-0" />
                  ) : (
                    <ImageIcon className="w-3.5 h-3.5 text-[#a78bfa] shrink-0" />
                  )}
                  <span className="text-[#ddd6fe] text-xs truncate">
                    {attachment.name}
                  </span>
                  <button
                    onClick={() => !isDisabled && onRemoveAttachment(attachment.id)}
                    disabled={isDisabled}
                    className="shrink-0 p-0.5 hover:bg-white/10 active:bg-white/20 rounded-full transition-colors disabled:opacity-40"
                  >
                    <X className="w-3 h-3 text-[#f87171]" />
                  </button>
                </motion.div>
              ))}
            </div>
          )}

          {/* Upload status */}
          {uploadStatus && (
            <div className="mt-3 flex items-center gap-2">
              {uploading && <Loader2 className="w-3 h-3 text-[#a78bfa] animate-spin shrink-0" />}
              <p className="text-xs text-[#a78bfa]">{uploadStatus}</p>
            </div>
          )}
        </div>
      </section>

      {/* ── Step 2: Options (collapsible) ──────────────────────────── */}
      <section className="bg-white/[0.04] border border-white/10 rounded-2xl overflow-hidden">
        <button
          onClick={() => setStep2Expanded(!step2Expanded)}
          className="w-full h-14 px-4 sm:px-6 flex items-center justify-between hover:bg-white/[0.03] active:bg-white/[0.06] transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <span
              className={`w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0 transition-all duration-300 ${
                hasInput
                  ? "bg-gradient-to-br from-[#a78bfa] to-[#f9a8d4] shadow-[0_0_12px_rgba(249,168,212,0.4)]"
                  : "bg-white/10"
              }`}
            >
              2
            </span>
            <h3
              className={`text-xs font-semibold uppercase tracking-widest transition-colors ${
                hasInput ? "text-[#f2efff]" : "text-[#857ca2]"
              }`}
            >
              Options
            </h3>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-[#857ca2] transition-transform duration-200 ${
              step2Expanded ? "rotate-180" : ""
            }`}
          />
        </button>

        <AnimatePresence initial={false}>
          {step2Expanded && (
            <motion.div
              key="options"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="px-4 sm:px-6 pb-5 space-y-5 border-t border-white/[0.06]">
                <div className="pt-5 space-y-5">
                  {/* Difficulty */}
                  <div>
                    <label className="block text-[10px] font-semibold text-[#857ca2] uppercase tracking-widest mb-2.5">
                      Difficulty
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {difficultyOptions.map((diff) => (
                        <motion.button
                          key={diff}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => !isDisabled && onDifficultyChange(diff)}
                          disabled={isDisabled}
                          className={`h-11 rounded-full text-sm font-semibold transition-all disabled:cursor-not-allowed ${
                            difficulty === diff
                              ? `bg-gradient-to-r ${difficultyColor[diff]} text-white shadow-lg`
                              : "bg-white/[0.04] border border-white/10 text-[#857ca2] hover:text-[#ddd6fe] hover:border-white/20"
                          }`}
                        >
                          {diff.charAt(0).toUpperCase() + diff.slice(1)}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Format */}
                  <div>
                    <label className="block text-[10px] font-semibold text-[#857ca2] uppercase tracking-widest mb-2.5">
                      Format
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {formatOptions.map((fmt) => (
                        <motion.button
                          key={fmt.value}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => !isDisabled && onModeChange(fmt.value)}
                          disabled={isDisabled}
                          className={`h-9 px-4 rounded-full text-xs font-semibold transition-all disabled:cursor-not-allowed ${
                            mode === fmt.value
                              ? "bg-gradient-to-r from-[#a78bfa] to-[#f9a8d4] text-white shadow-md"
                              : "bg-white/[0.04] border border-white/10 text-[#857ca2] hover:text-[#ddd6fe] hover:border-white/20"
                          }`}
                        >
                          {fmt.label}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Question Count */}
                  <div>
                    <label className="block text-[10px] font-semibold text-[#857ca2] uppercase tracking-widest mb-2.5">
                      Questions
                    </label>
                    <div className="flex items-center gap-4">
                      <motion.button
                        whileTap={{ scale: 0.88 }}
                        onClick={() =>
                          !isDisabled && onQuestionCountChange(Math.max(1, questionCount - 1))
                        }
                        disabled={isDisabled || questionCount <= 1}
                        className="w-11 h-11 rounded-full bg-white/[0.04] border border-white/10 hover:bg-white/[0.07] active:bg-white/10 transition-colors flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Minus className="w-4 h-4 text-[#ddd6fe]" />
                      </motion.button>

                      <div className="flex-1 text-center">
                        <span className="text-3xl font-bold text-[#f2efff] tabular-nums">
                          {questionCount}
                        </span>
                      </div>

                      <motion.button
                        whileTap={{ scale: 0.88 }}
                        onClick={() =>
                          !isDisabled && onQuestionCountChange(Math.min(20, questionCount + 1))
                        }
                        disabled={isDisabled || questionCount >= 20}
                        className="w-11 h-11 rounded-full bg-white/[0.04] border border-white/10 hover:bg-white/[0.07] active:bg-white/10 transition-colors flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Plus className="w-4 h-4 text-[#ddd6fe]" />
                      </motion.button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* ── Step 3: Generate ───────────────────────────────────────── */}
      <motion.button
        whileTap={{ scale: hasInput && !isDisabled ? 0.98 : 1 }}
        onClick={onGenerate}
        disabled={!hasInput || isDisabled}
        className={`w-full h-14 rounded-2xl font-bold text-sm tracking-widest uppercase transition-all duration-300 flex items-center justify-center gap-2.5 ${
          hasInput && !isDisabled
            ? "bg-gradient-to-r from-[#a78bfa] to-[#f9a8d4] text-white shadow-[0_8px_24px_rgba(167,139,250,0.4)] hover:shadow-[0_12px_32px_rgba(167,139,250,0.6)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[0_4px_12px_rgba(167,139,250,0.3)] animate-shimmer"
            : "bg-white/[0.04] text-[#857ca2] cursor-not-allowed border border-white/10"
        }`}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Generating…
          </>
        ) : (
          "Generate Questions"
        )}
      </motion.button>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="p-4 bg-red-500/10 border border-red-500/25 rounded-xl text-sm text-red-400"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}