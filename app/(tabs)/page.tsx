"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Loader2, Plus } from "lucide-react";
import { upload } from "@vercel/blob/client";
import { toast } from "sonner";
import { SessionForm } from "@/components/SessionForm";
import { GeneratedQuestionsView } from "@/components/GeneratedQuestionsView";
import { TestScreen } from "@/components/TestScreen";
import { ResultsScreen } from "@/components/ResultsScreen";
import { TestOptionsSheet } from "@/components/TestOptionsSheet";
import { BottomSheet } from "@/components/BottomSheet";
import { PageTitle } from "@/components/layout/PageTitle";
import { Aawax } from "@/components/mascot/Aawax";
import { useAuth } from "@/lib/useAuth";
import { useMascot } from "@/lib/mascot/MascotContext";
import { compressImage } from "@/lib/imageCompression";

const MAX_IMAGE_SIZE_BYTES = 20 * 1024 * 1024;
const MAX_PDF_SIZE_BYTES = 15 * 1024 * 1024;
const MAX_IMAGES = 4;
const sanitizeUploadName = (name: string) =>
  name.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "") || "upload.jpg";

type SourceKind = "text" | "pdf" | "document" | "image" | null;
type Attachment = {
  id: string;
  name: string;
  type: "pdf" | "document" | "image";
  extractedText?: string;
  mimeType: string;
  blobUrl?: string;
  origin: "upload" | "camera";
};
type QuestionItem = {
  question?: string;
  statement?: string;
  answer?: string | boolean;
  expected_answer?: string;
  expectedAnswer?: string;
  options?: string[];
  front?: string;
  back?: string;
};
type QuestionSet = {
  multiple_choice?: QuestionItem[];
  short_answer?: QuestionItem[];
  true_false?: QuestionItem[];
  flashcards?: QuestionItem[];
};
type TestAnswers = Record<string, string>;
type ShortAnswerEvaluation = { index?: number; correct?: boolean; feedback?: string };
type TestSubmission = {
  id: string;
  created_at: string;
  score: number;
  total: number;
  answers: TestAnswers;
  questions: QuestionSet;
  shortAnswerEvaluations?: ShortAnswerEvaluation[];
  sessionId?: string;
  sessionTitle?: string;
};
type ReviewQuestion = {
  question?: string;
  statement?: string;
  answer: string;
  userAnswer: string;
  correct?: boolean;
  explanation?: string;
};

const getErrorMessage = (err: unknown, fallback: string) =>
  err instanceof Error && err.message ? err.message : fallback;

export default function GeneratePage() {
  const { user } = useAuth();
  const { setMood, color, design } = useMascot();

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionTitle, setSessionTitle] = useState("New session");
  const [sourceKind, setSourceKind] = useState<SourceKind>(null);
  const [text, setText] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [mode, setMode] = useState("mix");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "difficult">("medium");
  const [questionCount, setQuestionCount] = useState(5);
  const [questions, setQuestions] = useState<QuestionSet | null>(null);

  const [testMode, setTestMode] = useState(false);
  const [testQuestions, setTestQuestions] = useState<QuestionSet | null>(null);
  const [testAnswers, setTestAnswers] = useState<TestAnswers>({});
  const [testScore, setTestScore] = useState<{ score: number; total: number } | null>(null);
  const [activeShortEvals, setActiveShortEvals] = useState<ShortAnswerEvaluation[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [timerMinutes, setTimerMinutes] = useState<number | null>(null);

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [error, setError] = useState("");
  const [testOptionsOpen, setTestOptionsOpen] = useState(false);

  const hasResults = !!(
    questions &&
    ((questions.multiple_choice?.length ?? 0) > 0 ||
      (questions.short_answer?.length ?? 0) > 0 ||
      (questions.true_false?.length ?? 0) > 0 ||
      (questions.flashcards?.length ?? 0) > 0)
  );

  // Open a session passed via ?session=<id> (from History/Tests tabs).
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("session");
    if (id) void openSession(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mascot mirrors generation state.
  useEffect(() => {
    if (loading) setMood("think");
    else if (hasResults) setMood("cheer");
    else setMood("idle");
  }, [loading, hasResults, setMood]);

  const resetSession = () => {
    setSessionId(null);
    setSessionTitle("New session");
    setSourceKind(null);
    setText("");
    setAttachments([]);
    setQuestions(null);
    setUploadStatus("");
    setError("");
    setTestMode(false);
    setTestQuestions(null);
    setTestAnswers({});
    setTestScore(null);
    setCurrentQuestionIndex(0);
    setShowResults(false);
    setTimerMinutes(null);
  };

  const uploadDocumentViaBlob = async (file: File, kind: "pdf" | "document"): Promise<string> => {
    setUploadStatus(`Uploading ${kind === "pdf" ? "PDF" : "document"}...`);
    const safeName = sanitizeUploadName(file.name);
    const contentType =
      kind === "pdf"
        ? "application/pdf"
        : file.type || "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    const blob = await upload(`study-buddy-documents/${Date.now()}-${safeName}`, file, {
      access: "public",
      contentType,
      handleUploadUrl: "/api/blob/upload",
      clientPayload: JSON.stringify({ kind }),
    });
    setUploadStatus(`Extracting ${kind === "pdf" ? "PDF" : "document"} text...`);
    const res = await fetch("/api/upload-pdf/process", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: blob.url, kind }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Failed to upload ${kind === "pdf" ? "PDF" : "document"}`);
    setUploadStatus(`Extracted text from ${data.pages || "?"} ${kind === "pdf" ? "pages" : "document"}.`);
    return data.text || "";
  };

  const uploadImageViaBlob = async (file: File): Promise<string> => {
    setUploadStatus(`Uploading ${file.name}...`);
    const safeName = sanitizeUploadName(
      file.name.toLowerCase().endsWith(".jpg") || file.name.toLowerCase().endsWith(".jpeg")
        ? file.name
        : `${file.name}.jpg`
    );
    const blob = await upload(`study-buddy-images/${Date.now()}-${safeName}`, file, {
      access: "public",
      contentType: file.type || "image/jpeg",
      handleUploadUrl: "/api/blob/upload",
      clientPayload: JSON.stringify({ kind: "image" }),
    });
    return blob.url;
  };

  const handleFilesAdded = async (
    event: React.ChangeEvent<HTMLInputElement>,
    origin: "upload" | "camera"
  ) => {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;
    if (!user) {
      setError("Please sign in to upload files.");
      toast.error("Please sign in to upload files.");
      event.target.value = "";
      return;
    }
    if (sourceKind === "text" || text.trim()) {
      setError("This session already uses pasted notes. Start a new session to switch source type.");
      event.target.value = "";
      return;
    }
    setUploading(true);
    setError("");
    setUploadStatus("Preparing files...");
    try {
      const incomingKind: SourceKind =
        files[0].type === "application/pdf" || files[0].name.toLowerCase().endsWith(".pdf")
          ? "pdf"
          : files[0].type ===
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
              files[0].name.toLowerCase().endsWith(".docx") ||
              files[0].name.toLowerCase().endsWith(".doc")
            ? "document"
            : "image";
      if (sourceKind && sourceKind !== incomingKind)
        throw new Error("Only one source type is allowed in a session.");
      if (incomingKind === "pdf" && (files.length > 1 || attachments.length > 0))
        throw new Error("Only one PDF can be used in a session.");
      if (incomingKind === "document" && (files.length > 1 || attachments.length > 0))
        throw new Error("Only one document can be used in a session.");
      if (incomingKind === "image" && attachments.length + files.length > MAX_IMAGES)
        throw new Error(`Maximum ${MAX_IMAGES} images allowed per session.`);

      const parsed: Attachment[] = [];
      for (const file of files) {
        const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
        const isDocument =
          file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
          file.name.toLowerCase().endsWith(".docx") ||
          file.name.toLowerCase().endsWith(".doc");
        const isImage = file.type.startsWith("image/");
        if (incomingKind === "pdf" && !isPdf) throw new Error("PDF sessions can only contain a PDF.");
        if (incomingKind === "document" && !isDocument)
          throw new Error("Document sessions can only contain a DOCX file.");
        if (incomingKind === "image" && !isImage)
          throw new Error("Photo sessions can only contain images.");
        if (isPdf && file.size > MAX_PDF_SIZE_BYTES) throw new Error(`${file.name}: PDF too large (max 15MB).`);
        if (isDocument && file.size > MAX_PDF_SIZE_BYTES)
          throw new Error(`${file.name}: document too large (max 15MB).`);
        if (isImage && file.size > MAX_IMAGE_SIZE_BYTES)
          throw new Error(`${file.name}: image too large (max 20MB before compression).`);

        if (isPdf || isDocument) {
          if (file.name.toLowerCase().endsWith(".doc"))
            throw new Error(`${file.name}: .doc files are not supported. Please upload a .docx file.`);
          const extractedText = await uploadDocumentViaBlob(file, isPdf ? "pdf" : "document");
          parsed.push({
            id: `${file.name}-${file.size}-${file.lastModified}`,
            name: file.name,
            type: isPdf ? "pdf" : "document",
            extractedText: extractedText.trim(),
            mimeType: isPdf
              ? "application/pdf"
              : "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            origin,
          });
        } else {
          setUploadStatus(`Compressing ${file.name}...`);
          const compressed = await compressImage(file, (p) => {
            setUploadStatus(`Compressing ${p.fileName}... ${p.progress}%`);
          });
          const blobUrl = await uploadImageViaBlob(compressed);
          parsed.push({
            id: `${file.name}-${file.size}-${file.lastModified}`,
            name: file.name,
            type: "image",
            mimeType: compressed.type || "image/jpeg",
            blobUrl,
            origin,
          });
        }
      }
      setAttachments((current) => [...current, ...parsed]);
      setSourceKind(incomingKind);
      setSessionTitle(parsed[0]?.name || "File session");
      setUploadStatus(`Added ${parsed.length} file${parsed.length === 1 ? "" : "s"}.`);
      toast.success(`${parsed.length} file${parsed.length === 1 ? "" : "s"} added.`);
    } catch (err: unknown) {
      const msg = getErrorMessage(err, "Could not read the selected file.");
      setError(msg);
      toast.error(msg);
    } finally {
      event.target.value = "";
      setUploading(false);
    }
  };

  const handleTextChange = (value: string) => {
    if (sourceKind && sourceKind !== "text") {
      setError("This session already uses files. Start a new session to switch source type.");
      return;
    }
    setText(value);
    setSourceKind(value.trim() ? "text" : null);
    setSessionTitle(value.trim() ? value.trim().slice(0, 42) : "New session");
    setError("");
  };

  const generate = async () => {
    if (!sourceKind) {
      setError("Add notes, one PDF, or one or more photos first.");
      return;
    }
    if (!user) {
      setError("Please sign in to generate questions.");
      toast.error("Please sign in to generate questions.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          text: sourceKind === "text" ? text : "",
          attachments,
          mode,
          difficulty,
        }),
      });
      const raw = await res.text();
      let data: Record<string, unknown> = {};
      if (raw) {
        try {
          data = JSON.parse(raw);
        } catch {
          data = {};
        }
      }
      if (!res.ok) throw new Error(String(data.detail || raw || "Could not generate questions."));
      setSessionId(typeof data.sessionId === "string" ? data.sessionId : sessionId);
      setQuestions((data.questions as QuestionSet | null | undefined) ?? null);
      toast.success("Questions generated!");
    } catch (err: unknown) {
      const msg = getErrorMessage(err, "Could not generate questions.");
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const openSession = async (id: string) => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/generate?sessionId=${encodeURIComponent(id)}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || "Could not open session.");
      const session = data.session;
      setSessionId(session.id);
      setSessionTitle(session.title);
      setSourceKind(session.source_kind);
      setMode(session.latest_mode ?? "mix");
      setDifficulty(session.latest_difficulty ?? "medium");
      setText(session.source_kind === "text" ? session.source_payload?.text ?? "" : "");
      setAttachments(session.source_payload?.attachments ?? []);
      setQuestions(session.latest_generation?.questions ?? null);
      setTestMode(false);
      setShowResults(false);
      toast.success("Session loaded.");
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Could not open session."));
    } finally {
      setLoading(false);
    }
  };

  const startTest = async (scope: string, timer: number | null) => {
    if (!sessionId) {
      setError("Generate at least one question set before taking a test.");
      return;
    }
    setLoading(true);
    setError("");
    setTestOptionsOpen(false);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate_test",
          sessionId,
          includePrevious: scope === "include-previous",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || "Could not generate test.");
      setTestQuestions(data.questions ?? null);
      setTestAnswers({});
      setShowResults(false);
      setTestScore(null);
      setCurrentQuestionIndex(0);
      setTimerMinutes(timer);
      setTestMode(true);
      toast.success("Test ready. Good luck!");
    } catch (err: unknown) {
      const msg = getErrorMessage(err, "Could not generate test.");
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const submitTest = async () => {
    if (!testQuestions || !sessionId) return;
    let score = 0;
    let total = 0;
    const mcq = Array.isArray(testQuestions.multiple_choice) ? testQuestions.multiple_choice : [];
    mcq.forEach((q, i) => {
      total += 1;
      const expected = String(q.answer ?? "").trim().toUpperCase().match(/[A-D]/)?.[0] || "";
      if ((testAnswers[`mcq-${i}`] ?? "") === expected) score += 1;
    });
    const tf = Array.isArray(testQuestions.true_false) ? testQuestions.true_false : [];
    tf.forEach((q, i) => {
      total += 1;
      const expected = typeof q.answer === "boolean" ? (q.answer ? "True" : "False") : String(q.answer);
      if ((testAnswers[`tf-${i}`] ?? "") === expected) score += 1;
    });
    const shortAnswer = Array.isArray(testQuestions.short_answer) ? testQuestions.short_answer : [];
    let shortAnswerEvaluations: ShortAnswerEvaluation[] = [];
    if (shortAnswer.length) {
      total += shortAnswer.length;
      const gradeRes = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "grade_short_answers", questions: shortAnswer, answers: testAnswers }),
      });
      const gradeData = await gradeRes.json().catch(() => ({}));
      if (!gradeRes.ok) {
        toast.error("Could not grade short answers.");
        return;
      }
      shortAnswerEvaluations = Array.isArray(gradeData.evaluations) ? gradeData.evaluations : [];
      score += Number(gradeData.score ?? 0);
    }
    const payload: TestSubmission = {
      id: `${Date.now()}`,
      created_at: new Date().toISOString(),
      score,
      total,
      answers: testAnswers,
      questions: testQuestions,
      shortAnswerEvaluations,
      sessionId: sessionId || undefined,
      sessionTitle: sessionTitle || "Unknown Session",
    };
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "submit_test", sessionId, submission: payload }),
    });
    if (!res.ok) {
      toast.error("Could not save test submission.");
      return;
    }
    setActiveShortEvals(shortAnswerEvaluations);
    setTestScore({ score, total });
    setTestMode(false);
    setShowResults(true);
    const percentage = total ? Math.round((score / total) * 100) : 0;
    if (percentage >= 70) toast.success(`Great job! You scored ${percentage}%!`);
    else if (percentage >= 50) toast(`You scored ${percentage}%. Keep practicing!`, { icon: "📚" });
    else toast(`You scored ${percentage}%. Don't give up!`, { icon: "💪" });
  };

  const getFlattenedTestQuestions = () => {
    if (!testQuestions) return [];
    const all: Array<QuestionItem & { type: "mcq" | "tf" | "sa"; key: string; index: number }> = [];
    testQuestions.multiple_choice?.forEach((q, i) => all.push({ ...q, type: "mcq", key: `mcq-${i}`, index: i }));
    testQuestions.true_false?.forEach((q, i) => all.push({ ...q, type: "tf", key: `tf-${i}`, index: i }));
    testQuestions.short_answer?.forEach((q, i) => all.push({ ...q, type: "sa", key: `sa-${i}`, index: i }));
    return all;
  };

  const buildReviewQuestions = (
    questionSet: QuestionSet | null | undefined,
    answers: TestAnswers,
    shortAnswerEvaluations?: ShortAnswerEvaluation[]
  ) => {
    if (!questionSet) return [];
    const results: ReviewQuestion[] = [];
    questionSet.multiple_choice?.forEach((q, i) => {
      const userAnswer = answers[`mcq-${i}`];
      results.push({
        question: q.question,
        answer: String(q.answer ?? ""),
        userAnswer: userAnswer || "No answer",
        correct: userAnswer === String(q.answer ?? "").trim().toUpperCase().match(/[A-D]/)?.[0],
      });
    });
    questionSet.true_false?.forEach((q, i) => {
      const userAnswer = answers[`tf-${i}`];
      const correctAnswer = typeof q.answer === "boolean" ? (q.answer ? "True" : "False") : String(q.answer);
      results.push({
        statement: q.statement,
        answer: correctAnswer,
        userAnswer: userAnswer || "No answer",
        correct: userAnswer === correctAnswer,
      });
    });
    questionSet.short_answer?.forEach((q, i) => {
      const userAnswer = answers[`sa-${i}`];
      const evaluation = shortAnswerEvaluations?.find((e) => e.index === i);
      results.push({
        question: q.question,
        answer: String(q.answer ?? ""),
        userAnswer: userAnswer || "No answer",
        correct: evaluation?.correct,
        explanation: evaluation?.feedback,
      });
    });
    return results;
  };

  const flatQuestions = getFlattenedTestQuestions();
  const currentQuestion = flatQuestions[currentQuestionIndex];

  // ── Full-screen flows ──────────────────────────────────────────
  if (showResults && testScore) {
    return (
      <div className="fixed inset-0 z-[70] overflow-y-auto bg-[#06060b]">
        <ResultsScreen
          score={testScore.score}
          total={testScore.total}
          questions={buildReviewQuestions(testQuestions, testAnswers, activeShortEvals)}
          onRetakeTest={() => {
            setShowResults(false);
            setTestAnswers({});
            setCurrentQuestionIndex(0);
            setTestMode(true);
          }}
          onNewSession={resetSession}
        />
      </div>
    );
  }

  if (testMode && currentQuestion) {
    return (
      <div className="fixed inset-0 z-[70] overflow-y-auto bg-[#06060b]">
        <TestScreen
          questions={flatQuestions}
          questionType={currentQuestion.type}
          currentIndex={currentQuestionIndex}
          totalQuestions={flatQuestions.length}
          answer={testAnswers[currentQuestion.key]}
          onAnswer={(value) => setTestAnswers((prev) => ({ ...prev, [currentQuestion.key]: value }))}
          onPrevious={() => setCurrentQuestionIndex((p) => Math.max(0, p - 1))}
          onNext={() => setCurrentQuestionIndex((p) => Math.min(flatQuestions.length - 1, p + 1))}
          onExit={() => {
            setTestMode(false);
            setTestQuestions(null);
            setTestAnswers({});
            setCurrentQuestionIndex(0);
            setTimerMinutes(null);
          }}
          isLastQuestion={currentQuestionIndex === flatQuestions.length - 1}
          onSubmit={submitTest}
          timerMinutes={timerMinutes}
        />
      </div>
    );
  }

  // ── Generate workspace ─────────────────────────────────────────
  return (
    <>
      <PageTitle
        eyebrow="Generate"
        title="Turn notes into questions"
        subtitle="Paste notes, or upload a PDF, document, or photos — Aawax turns them into smart study questions."
      />

      {!user && (
        <div className="mb-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-center text-sm text-white/60">
          <span style={{ color: "var(--accent-soft)" }}>Sign in</span> to generate questions and save your
          progress.
        </div>
      )}

      <SessionForm
        text={text}
        onTextChange={handleTextChange}
        attachments={attachments}
        onFilesAdded={handleFilesAdded}
        onRemoveAttachment={(id) => setAttachments((prev) => prev.filter((a) => a.id !== id))}
        difficulty={difficulty}
        onDifficultyChange={setDifficulty}
        mode={mode}
        onModeChange={setMode}
        questionCount={questionCount}
        onQuestionCountChange={setQuestionCount}
        onGenerate={generate}
        loading={loading}
        uploading={uploading}
        error={error}
        uploadStatus={uploadStatus}
      />

      {hasResults && questions ? (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mt-6"
        >
          <button onClick={() => setTestOptionsOpen(true)} disabled={loading || uploading} className="btn-primary">
            <BookOpen className="h-4 w-4" /> TAKE TEST
          </button>
          <div className="mt-6">
            <GeneratedQuestionsView questions={questions} difficulty={difficulty} mode={mode} />
          </div>
        </motion.div>
      ) : (
        !loading && (
          <div className="mt-10 flex flex-col items-center text-center">
            <Aawax design={design} color={color} mood="idle" size={120} glow float />
            <p className="mt-3 font-serif text-lg text-white">Ready when you are</p>
            <p className="mt-1 max-w-xs text-sm text-white/50">
              Add some study material above and tap Generate to get your first question set.
            </p>
          </div>
        )
      )}

      {hasResults && (
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={resetSession}
          className="fixed bottom-[150px] right-4 z-30 flex h-12 w-12 items-center justify-center rounded-full text-[#0a0a12]"
          style={{
            background: "linear-gradient(135deg, var(--accent-soft), var(--accent))",
            boxShadow: "0 8px 24px rgba(var(--accent-glow),0.4)",
          }}
          aria-label="New session"
        >
          <Plus className="h-6 w-6" />
        </motion.button>
      )}

      <BottomSheet isOpen={testOptionsOpen} onClose={() => setTestOptionsOpen(false)}>
        <TestOptionsSheet
          onSelect={(optionId, timerMins) => {
            setTestOptionsOpen(false);
            startTest(optionId, timerMins);
          }}
        />
      </BottomSheet>

      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          >
            <div className="flex flex-col items-center gap-4 rounded-3xl border border-white/10 bg-[#0b0b12] p-8">
              <Aawax design={design} color={color} mood="think" size={96} float />
              <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--accent)" }} />
              <p className="text-sm text-white/70">Aawax is thinking...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
