"use client";

import { useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Camera, X, FileText, Image as ImageIcon, Loader2, Sparkles } from "lucide-react";

interface Attachment {
  id: string;
  name: string;
  type: "pdf" | "document" | "image";
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
  questionCount?: number;
  onQuestionCountChange?: (value: number) => void;
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
  { value: "true-false", label: "True / False" },
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
  onGenerate,
  loading,
  uploading,
  error,
  uploadStatus,
}: SessionFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const hasInput = Boolean(text.trim() || attachments.length > 0);
  const isDisabled = loading || uploading;

  const accentChip = (active: boolean) =>
    active
      ? { background: "linear-gradient(135deg, var(--accent-soft), var(--accent))", color: "#0a0a12" }
      : undefined;

  return (
    <div className="space-y-4">
      {/* ── Input card ─────────────────────────────────────────── */}
      <section className="app-card">
        <label className="mb-3 block text-[11px] font-bold uppercase tracking-[0.22em] text-white/40">
          Your material
        </label>

        <textarea
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          placeholder="Paste your notes here..."
          disabled={isDisabled}
          rows={5}
          className="w-full resize-none rounded-2xl border border-white/[0.08] bg-black/30 px-4 py-3 text-sm text-white placeholder:text-white/30 transition-all focus:outline-none focus:ring-2 disabled:opacity-50"
          style={{ ["--tw-ring-color" as string]: "var(--accent)" }}
        />

        <div className="mt-3 grid grid-cols-2 gap-2.5">
          <button
            onClick={() => !isDisabled && fileInputRef.current?.click()}
            disabled={isDisabled}
            className="btn-outline w-full"
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            <span className="truncate">{uploading ? "Uploading..." : "Add files"}</span>
          </button>
          <button
            onClick={() => !isDisabled && cameraInputRef.current?.click()}
            disabled={isDisabled}
            className="btn-outline w-full"
          >
            <Camera className="h-4 w-4" />
            <span className="truncate">Take photo</span>
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.docx,.doc,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/*"
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

        {attachments.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            <AnimatePresence>
              {attachments.map((attachment) => (
                <motion.div
                  key={attachment.id}
                  initial={{ opacity: 0, scale: 0.88 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.88 }}
                  className="flex max-w-[200px] items-center gap-1.5 rounded-full border py-1.5 pl-2.5 pr-1.5 text-sm"
                  style={{
                    background: "rgba(var(--accent-glow), 0.1)",
                    borderColor: "rgba(var(--accent-glow), 0.25)",
                  }}
                >
                  {attachment.type === "image" ? (
                    <ImageIcon className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--accent-soft)" }} />
                  ) : (
                    <FileText className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--accent-soft)" }} />
                  )}
                  <span className="truncate text-xs text-white/80">{attachment.name}</span>
                  <button
                    onClick={() => !isDisabled && onRemoveAttachment(attachment.id)}
                    disabled={isDisabled}
                    className="shrink-0 rounded-full p-0.5 transition-colors hover:bg-white/10 cursor-pointer"
                    aria-label="Remove"
                  >
                    <X className="h-3 w-3 text-red-400" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {uploadStatus && (
          <div className="mt-3 flex items-center gap-2">
            {uploading && <Loader2 className="h-3 w-3 animate-spin" style={{ color: "var(--accent-soft)" }} />}
            <p className="text-xs" style={{ color: "var(--accent-soft)" }}>
              {uploadStatus}
            </p>
          </div>
        )}
      </section>

      {/* ── Options card ───────────────────────────────────────── */}
      <section className="app-card space-y-5">
        <div>
          <label className="mb-2.5 block text-[11px] font-bold uppercase tracking-[0.22em] text-white/40">
            Difficulty
          </label>
          <div className="grid grid-cols-3 gap-2">
            {difficultyOptions.map((diff) => {
              const active = difficulty === diff;
              return (
                <button
                  key={diff}
                  onClick={() => !isDisabled && onDifficultyChange(diff)}
                  disabled={isDisabled}
                  className="h-11 rounded-full border text-sm font-semibold capitalize transition-all cursor-pointer"
                  style={{
                    ...accentChip(active),
                    borderColor: active ? "transparent" : "rgba(255,255,255,0.1)",
                    color: active ? "#0a0a12" : "rgba(255,255,255,0.6)",
                    background: active
                      ? "linear-gradient(135deg, var(--accent-soft), var(--accent))"
                      : "rgba(255,255,255,0.04)",
                  }}
                >
                  {diff}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="mb-2.5 block text-[11px] font-bold uppercase tracking-[0.22em] text-white/40">
            Format
          </label>
          <div className="flex flex-wrap gap-2">
            {formatOptions.map((fmt) => {
              const active = mode === fmt.value;
              return (
                <button
                  key={fmt.value}
                  onClick={() => !isDisabled && onModeChange(fmt.value)}
                  disabled={isDisabled}
                  className="h-9 rounded-full border px-4 text-xs font-semibold transition-all cursor-pointer"
                  style={{
                    borderColor: active ? "transparent" : "rgba(255,255,255,0.1)",
                    color: active ? "#0a0a12" : "rgba(255,255,255,0.6)",
                    background: active
                      ? "linear-gradient(135deg, var(--accent-soft), var(--accent))"
                      : "rgba(255,255,255,0.04)",
                  }}
                >
                  {fmt.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Generate ───────────────────────────────────────────── */}
      <motion.button
        whileTap={{ scale: hasInput && !isDisabled ? 0.98 : 1 }}
        onClick={onGenerate}
        disabled={!hasInput || isDisabled}
        className="btn-primary"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Generating...
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" /> GENERATE QUESTIONS
          </>
        )}
      </motion.button>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="rounded-2xl border border-red-500/25 bg-red-500/10 p-4 text-sm text-red-400"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
