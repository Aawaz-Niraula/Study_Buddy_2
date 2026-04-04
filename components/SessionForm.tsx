"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Upload, Camera, X, FileText, Image as ImageIcon, Minus, Plus } from "lucide-react";

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
  error,
  uploadStatus,
}: SessionFormProps) {
  const [step2Expanded, setStep2Expanded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const hasInput = text.trim() || attachments.length > 0;

  // Auto-expand step 2 when input exists
  const shouldExpandStep2 = hasInput && !step2Expanded;
  if (shouldExpandStep2) {
    setStep2Expanded(true);
  }

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      {/* Step 1: Input Section */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#a78bfa] to-[#f9a8d4] flex items-center justify-center text-white font-bold text-sm">
              1
            </div>
            <h3 className="text-sm font-medium text-[#f2efff] uppercase tracking-wide">
              Input
            </h3>
          </div>

          {/* Textarea */}
          <textarea
            value={text}
            onChange={(e) => onTextChange(e.target.value)}
            placeholder="Paste your notes here..."
            className="w-full min-h-[120px] bg-[#11111a] border-none rounded-xl px-4 py-3 text-[#f2efff] text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#a78bfa]/40 placeholder-[#857ca2]"
            style={{ fontFamily: "inherit" }}
          />

          {/* File Upload Buttons */}
          <div className="flex items-center gap-3 mt-4">
            <motion.button
              whileTap={{ opacity: 0.6 }}
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 min-h-[48px] px-4 py-2 bg-white/5 border border-white/10 rounded-full text-sm font-medium text-[#ddd6fe] hover:bg-white/8 transition-colors flex items-center justify-center gap-2"
            >
              <Upload className="w-4 h-4" />
              ADD FILES
            </motion.button>
            <motion.button
              whileTap={{ opacity: 0.6 }}
              onClick={() => cameraInputRef.current?.click()}
              className="flex-1 min-h-[48px] px-4 py-2 bg-white/5 border border-white/10 rounded-full text-sm font-medium text-[#ddd6fe] hover:bg-white/8 transition-colors flex items-center justify-center gap-2"
            >
              <Camera className="w-4 h-4" />
              TAKE PHOTO
            </motion.button>
          </div>

          {/* Hidden File Inputs */}
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

          {/* File Chips */}
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {attachments.map((attachment) => (
                <motion.div
                  key={attachment.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex items-center gap-2 px-3 py-2 bg-[#a78bfa]/10 border border-[#a78bfa]/30 rounded-full text-sm"
                >
                  {attachment.type === "pdf" ? (
                    <FileText className="w-4 h-4 text-[#a78bfa]" />
                  ) : (
                    <ImageIcon className="w-4 h-4 text-[#a78bfa]" />
                  )}
                  <span className="text-[#ddd6fe] max-w-[150px] truncate">
                    {attachment.name}
                  </span>
                  <button
                    onClick={() => onRemoveAttachment(attachment.id)}
                    className="p-0.5 hover:bg-white/10 rounded-full transition-colors"
                  >
                    <X className="w-3.5 h-3.5 text-[#f87171]" />
                  </button>
                </motion.div>
              ))}
            </div>
          )}

          {/* Upload Status */}
          {uploadStatus && (
            <p className="mt-3 text-xs text-[#a78bfa]">{uploadStatus}</p>
          )}
        </div>
      </div>

      {/* Step 2: Options Section */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <button
          onClick={() => setStep2Expanded(!step2Expanded)}
          className="w-full p-6 flex items-center justify-between hover:bg-white/5 transition-colors"
          disabled={!hasInput}
        >
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${hasInput ? "bg-gradient-to-r from-[#a78bfa] to-[#f9a8d4]" : "bg-white/10"}`}>
              2
            </div>
            <h3 className={`text-sm font-medium uppercase tracking-wide ${hasInput ? "text-[#f2efff]" : "text-[#857ca2]"}`}>
              Options
            </h3>
          </div>
          <ChevronDown
            className={`w-5 h-5 text-[#857ca2] transition-transform ${
              step2Expanded ? "rotate-180" : ""
            }`}
          />
        </button>

        <AnimatePresence>
          {step2Expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="px-6 pb-6 space-y-6">
                {/* Difficulty */}
                <div>
                  <label className="block text-xs text-[#857ca2] uppercase tracking-wide mb-3">
                    Difficulty
                  </label>
                  <div className="flex gap-2">
                    {difficultyOptions.map((diff) => (
                      <motion.button
                        key={diff}
                        whileTap={{ opacity: 0.6 }}
                        onClick={() => onDifficultyChange(diff)}
                        className={`flex-1 min-h-[48px] px-4 py-2 rounded-full text-sm font-medium transition-all ${
                          difficulty === diff
                            ? "bg-gradient-to-r from-[#a78bfa] to-[#f9a8d4] text-white"
                            : "bg-white/5 border border-white/10 text-[#ddd6fe] opacity-60 hover:opacity-100"
                        }`}
                      >
                        {diff.charAt(0).toUpperCase() + diff.slice(1)}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Format */}
                <div>
                  <label className="block text-xs text-[#857ca2] uppercase tracking-wide mb-3">
                    Format
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {formatOptions.map((fmt) => (
                      <motion.button
                        key={fmt.value}
                        whileTap={{ opacity: 0.6 }}
                        onClick={() => onModeChange(fmt.value)}
                        className={`px-4 py-2 min-h-[44px] rounded-full text-sm font-medium transition-all ${
                          mode === fmt.value
                            ? "bg-gradient-to-r from-[#a78bfa] to-[#f9a8d4] text-white"
                            : "bg-white/5 border border-white/10 text-[#ddd6fe] opacity-60 hover:opacity-100"
                        }`}
                      >
                        {fmt.label}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Question Count */}
                <div>
                  <label className="block text-xs text-[#857ca2] uppercase tracking-wide mb-3">
                    Number of Questions
                  </label>
                  <div className="flex items-center gap-4">
                    <motion.button
                      whileTap={{ opacity: 0.6 }}
                      onClick={() => onQuestionCountChange(Math.max(1, questionCount - 1))}
                      className="w-12 h-12 rounded-full bg-white/5 border border-white/10 hover:bg-white/8 transition-colors flex items-center justify-center"
                    >
                      <Minus className="w-5 h-5 text-[#ddd6fe]" />
                    </motion.button>
                    <div className="flex-1 text-center">
                      <span className="text-2xl font-bold text-[#f2efff]">{questionCount}</span>
                    </div>
                    <motion.button
                      whileTap={{ opacity: 0.6 }}
                      onClick={() => onQuestionCountChange(Math.min(20, questionCount + 1))}
                      className="w-12 h-12 rounded-full bg-white/5 border border-white/10 hover:bg-white/8 transition-colors flex items-center justify-center"
                    >
                      <Plus className="w-5 h-5 text-[#ddd6fe]" />
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Step 3: Generate Button */}
      <div className="pt-2">
        <motion.button
          whileTap={{ opacity: hasInput ? 0.6 : 1 }}
          onClick={onGenerate}
          disabled={!hasInput || loading}
          className={`w-full min-h-[56px] px-6 py-4 rounded-2xl font-bold text-sm tracking-wide transition-all ${
            hasInput && !loading
              ? "bg-gradient-to-r from-[#a78bfa] to-[#f9a8d4] text-white shadow-lg"
              : "bg-white/5 text-[#857ca2] opacity-50 cursor-not-allowed"
          }`}
        >
          {loading ? "GENERATING..." : "GENERATE QUESTIONS"}
        </motion.button>
      </div>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-sm text-red-400"
        >
          {error}
        </motion.div>
      )}
    </div>
  );
}
