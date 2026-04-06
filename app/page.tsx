"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import { TopBar } from "@/components/TopBar";
import GreetingBanner from "@/components/GreetingBanner";
import { Sidebar } from "@/components/Sidebar";
import { BottomSheet } from "@/components/BottomSheet";
import { SessionForm } from "@/components/SessionForm";
import { TestOptionsSheet } from "@/components/TestOptionsSheet";
import { SessionHistoryList } from "@/components/SessionHistoryList";
import { TestHistoryList, type TestSubmissionItem } from "@/components/TestHistoryList";
import { TestScreen } from "@/components/TestScreen";
import { ResultsScreen } from "@/components/ResultsScreen";
import { TestReviewScreen } from "@/components/TestReviewScreen";
import { GeneratedQuestionsView } from "@/components/GeneratedQuestionsView";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { Sparkles, CircleHelp, X, BookOpen, LayoutPanelLeft, Trophy, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/useAuth";
import { compressImage, fileToCompressedDataUrl } from "@/lib/imageCompression";
import { toast } from "sonner";

declare global {
  interface Window {
    pdfjsLib?: {
      GlobalWorkerOptions: { workerSrc: string };
      getDocument: (source: { data: Uint8Array }) => {
        promise: Promise<{
          numPages: number;
          getPage: (pageNumber: number) => Promise<{
            getTextContent: () => Promise<{ items: Array<{ str?: string }> }>;
          }>;
        }>;
      };
    };
  }
}

const MAX_IMAGE_SIZE_BYTES = 20 * 1024 * 1024; // 20MB raw (will be compressed)
const MAX_PDF_SIZE_BYTES = 15 * 1024 * 1024; // 15MB
const MAX_IMAGES = 3;
const MAX_GENERATE_REQUEST_BYTES = 18 * 1024 * 1024;

type SourceKind = "text" | "pdf" | "image" | null;
type Attachment = {
  id: string;
  name: string;
  type: "pdf" | "image";
  extractedText?: string;
  mimeType: string;
  dataUrl?: string;
  origin: "upload" | "camera";
};
type QuestionSet = {
  multiple_choice?: any[];
  short_answer?: any[];
  true_false?: any[];
  flashcards?: any[];
};
type Generation = {
  id: string;
  created_at: string;
  mode: string;
  difficulty: string;
  questions: QuestionSet;
};
type SessionListItem = {
  id: string;
  title: string;
  updated_at: string;
  latest_mode: string;
  latest_difficulty: string;
  source_kind: string;
};
type TestAnswers = Record<string, string>;
type ShortAnswerEvaluation = {
  index?: number;
  correct?: boolean;
  feedback?: string;
};
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

export default function Home() {
  const { user, loading: authLoading } = useAuth();

  // Session state
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionTitle, setSessionTitle] = useState("New session");
  const [sourceKind, setSourceKind] = useState<SourceKind>(null);
  const [text, setText] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [mode, setMode] = useState("mix");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "difficult">("medium");
  const [questionCount, setQuestionCount] = useState(5);
  const [questions, setQuestions] = useState<QuestionSet | null>(null);
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [activeGenerationId, setActiveGenerationId] = useState<string | null>(null);

  // Test state
  const [testMode, setTestMode] = useState(false);
  const [testQuestions, setTestQuestions] = useState<QuestionSet | null>(null);
  const [testAnswers, setTestAnswers] = useState<TestAnswers>({});
  const [testSubmitted, setTestSubmitted] = useState(false);
  const [testScore, setTestScore] = useState<{ score: number; total: number } | null>(null);
  const [testSubmissions, setTestSubmissions] = useState<TestSubmission[]>([]);
  const [allTestSubmissions, setAllTestSubmissions] = useState<TestSubmission[]>([]);
  const [activeTestSubmissionId, setActiveTestSubmissionId] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [timerMinutes, setTimerMinutes] = useState<number | null>(null);

  // UI state
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [error, setError] = useState("");
  const [sessionHistoryOpen, setSessionHistoryOpen] = useState(false);
  const [testHistoryOpen, setTestHistoryOpen] = useState(false);
  const [testOptionsOpen, setTestOptionsOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [history, setHistory] = useState<SessionListItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [reviewTestId, setReviewTestId] = useState<string | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);

  // Computed values
  const hasResults = !!(
    questions &&
    ((questions.multiple_choice?.length ?? 0) > 0 ||
      (questions.short_answer?.length ?? 0) > 0 ||
      (questions.true_false?.length ?? 0) > 0 ||
      (questions.flashcards?.length ?? 0) > 0)
  );

  const countQuestions = (set: QuestionSet | null | undefined) =>
    (set?.multiple_choice?.length ?? 0) +
    (set?.short_answer?.length ?? 0) +
    (set?.true_false?.length ?? 0) +
    (set?.flashcards?.length ?? 0);

  const generationItems = useMemo(
    () =>
      generations.map((generation) => ({
        id: generation.id,
        created_at: generation.created_at,
        difficulty: generation.difficulty,
        mode: generation.mode,
        questionCount: countQuestions(generation.questions),
      })),
    [generations]
  );

  const testHistoryItems: TestSubmissionItem[] = useMemo(() => {
    const currentSessionIds = new Set(testSubmissions.map(t => t.id));
    const historicalTests = allTestSubmissions.filter(t => !currentSessionIds.has(t.id));
    const combined = [...testSubmissions, ...historicalTests];
    
    return combined.map((submission) => ({
      id: submission.id,
      created_at: submission.created_at,
      score: submission.score,
      total: submission.total,
      sessionTitle: submission.sessionTitle,
    }));
  }, [testSubmissions, allTestSubmissions]);

  // Helper functions
  const resetSession = () => {
    setSessionId(null);
    setSessionTitle("New session");
    setSourceKind(null);
    setText("");
    setAttachments([]);
    setQuestions(null);
    setGenerations([]);
    setActiveGenerationId(null);
    setUploadStatus("");
    setError("");
    setTestMode(false);
    setTestQuestions(null);
    setTestAnswers({});
    setTestSubmitted(false);
    setTestScore(null);
    setTestSubmissions([]);
    setActiveTestSubmissionId(null);
    setCurrentQuestionIndex(0);
    setShowResults(false);
    setReviewTestId(null);
    setTimerMinutes(null);
    setSessionHistoryOpen(false);
    setTestHistoryOpen(false);
  };

  const loadHistory = async () => {
    if (!user) {
      setHistory([]);
      setAllTestSubmissions([]);
      return;
    }

    setHistoryLoading(true);
    try {
      const res = await fetch("/api/generate");
      const data = await res.json().catch(() => ({}));

      if (res.status === 401) {
        setHistory([]);
        setAllTestSubmissions([]);
        return;
      }

      const sessions = Array.isArray(data.sessions) ? data.sessions : [];
      setHistory(sessions);
      
      // Fetch full details for each session to get test_submissions
      const allTests: TestSubmission[] = [];
      for (const session of sessions) {
        try {
          const sessionRes = await fetch(`/api/generate?sessionId=${encodeURIComponent(session.id)}`);
          const sessionData = await sessionRes.json().catch(() => ({}));
          if (sessionData.session && Array.isArray(sessionData.session.test_submissions)) {
            for (const test of sessionData.session.test_submissions) {
              allTests.push({
                ...test,
                sessionId: session.id,
                sessionTitle: session.title,
              });
            }
          }
        } catch {
          // Skip sessions that fail to load
        }
      }
      setAllTestSubmissions(allTests);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Load history when user changes
  useEffect(() => {
    if (!authLoading) {
      loadHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user?.id]);

  // ─── PDF Upload via Vercel Blob ──────────────────────────────
  const uploadPdfViaBlob = async (file: File): Promise<string> => {
    setUploadStatus("Uploading PDF...");
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/upload-pdf", {
      method: "POST",
      body: formData,
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || "Failed to upload PDF");
    }

    setUploadStatus(`Extracted text from ${data.pages || "?"} pages.`);
    return data.text || "";
  };

  // ─── File Handler ────────────────────────────────────────────
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
      setError("This session already uses pasted notes. Click New Session to switch source type.");
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
          : "image";

      if (sourceKind && sourceKind !== incomingKind)
        throw new Error("Only one source type is allowed in a session.");
      if (incomingKind === "pdf" && (files.length > 1 || attachments.length > 0))
        throw new Error("Only one PDF can be used in a session.");

      // Image count limit
      if (incomingKind === "image") {
        const totalImages = attachments.length + files.length;
        if (totalImages > MAX_IMAGES) {
          throw new Error(`Maximum ${MAX_IMAGES} images allowed per session. You have ${attachments.length} already.`);
        }
      }

      const parsed: Attachment[] = [];
      for (const file of files) {
        const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
        const isImage = file.type.startsWith("image/");

        if (incomingKind === "pdf" && !isPdf) throw new Error("PDF sessions can only contain a PDF.");
        if (incomingKind === "image" && !isImage)
          throw new Error("Photo sessions can only contain images.");
        if (isPdf && file.size > MAX_PDF_SIZE_BYTES) throw new Error(`${file.name}: PDF too large (max 15MB).`);
        if (isImage && file.size > MAX_IMAGE_SIZE_BYTES)
          throw new Error(`${file.name}: image too large (max 20MB before compression).`);

        if (isPdf) {
          // Use Vercel Blob upload for PDFs
          const extractedText = await uploadPdfViaBlob(file);
          parsed.push({
            id: `${file.name}-${file.size}-${file.lastModified}`,
            name: file.name,
            type: "pdf",
            extractedText: extractedText.trim(),
            mimeType: "application/pdf",
            origin,
          });
        } else {
          // Compress image before creating data URL
          setUploadStatus(`Compressing ${file.name}...`);
          const compressed = await compressImage(file, (p) => {
            setUploadStatus(`Compressing ${p.fileName}... ${p.progress}%`);
          });
          
          setUploadStatus(`Processing ${file.name}...`);
          const dataUrl = await fileToCompressedDataUrl(compressed);

          parsed.push({
            id: `${file.name}-${file.size}-${file.lastModified}`,
            name: file.name,
            type: "image",
            mimeType: compressed.type || "image/jpeg",
            dataUrl,
            origin,
          });
        }
      }

      setAttachments((current) => [...current, ...parsed]);
      setSourceKind(incomingKind);
      setSessionTitle(parsed[0]?.name || "File session");
      setUploadStatus(`Added ${parsed.length} file${parsed.length === 1 ? "" : "s"}.`);
      toast.success(`${parsed.length} file${parsed.length === 1 ? "" : "s"} added successfully.`);
    } catch (err: any) {
      const msg = err.message || "Could not read the selected file.";
      setError(msg);
      toast.error(msg);
    } finally {
      event.target.value = "";
      setUploading(false);
    }
  };

  const handleTextChange = (value: string) => {
    if (sourceKind && sourceKind !== "text") {
      setError("This session already uses files. Click New Session to switch source type.");
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
      const requestBody = JSON.stringify({
        sessionId,
        text: sourceKind === "text" ? text : "",
        attachments,
        mode,
        difficulty,
      });

      if (sourceKind === "image" && requestBody.length > MAX_GENERATE_REQUEST_BYTES) {
        throw new Error("These photos are still too large to send together. Try smaller photos or fewer images.");
      }

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: requestBody,
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

      const generationId = `${Date.now()}`;
      setGenerations((current) => [
        ...current,
        {
          id: generationId,
          created_at: new Date().toISOString(),
          mode,
          difficulty,
          questions: ((data.questions as QuestionSet | null | undefined) ?? {}),
        },
      ]);
      setActiveGenerationId(generationId);

      toast.success("Questions generated successfully!");
      if (sessionHistoryOpen) await loadHistory();
    } catch (err: any) {
      const msg = err.message || "Could not generate questions.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const openSession = async (id: string) => {
    setError("");
    setActionLoading(true);
    try {
      const res = await fetch(`/api/generate?sessionId=${encodeURIComponent(id)}`);
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.detail || "Could not open session.");
        toast.error(data.detail || "Could not open session.");
        return;
      }

      const session = data.session;
      setSessionId(session.id);
      setSessionTitle(session.title);
      setSourceKind(session.source_kind);
      setMode(session.latest_mode ?? "mix");
      setDifficulty(session.latest_difficulty ?? "medium");
      
      if (session.source_kind === "text") {
        setText(session.source_payload?.text ?? "");
      } else {
        setText("");
      }
      
      setAttachments(session.source_payload?.attachments ?? []);
      setGenerations(Array.isArray(session.generations) ? session.generations : []);
      setQuestions(session.latest_generation?.questions ?? null);
      setActiveGenerationId(session.latest_generation?.id ?? null);
      
      const sessionTests = Array.isArray(session.test_submissions) ? session.test_submissions : [];
      setTestSubmissions(sessionTests.map((t: any) => ({
        ...t,
        sessionId: session.id,
        sessionTitle: session.title,
      })));
      
      setUploadStatus("");
      setSessionHistoryOpen(false);
      setTestHistoryOpen(false);
      setTestMode(false);
      setTestQuestions(null);
      setTestAnswers({});
      setTestSubmitted(false);
      setTestScore(null);
      setShowResults(false);
      toast.success("Session loaded.");
    } catch (err: any) {
      const msg = err.message || "Could not open session.";
      setError(msg);
      toast.error(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const deleteSession = async (id: string) => {
    setDeletingSessionId(id);
    try {
      const res = await fetch(`/api/generate?sessionId=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        if (sessionId === id) resetSession();
        await loadHistory();
        toast.success("Session deleted.");
      } else {
        toast.error("Could not delete session.");
      }
    } catch {
      toast.error("Could not delete session.");
    } finally {
      setDeletingSessionId(null);
    }
  };

  const startTest = async (scope: string, timer: number | null) => {
    if (!sessionId) {
      setError("Generate at least one question set in this session before taking a test.");
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
      setTestSubmitted(false);
      setShowResults(false);
      setTestScore(null);
      setTestHistoryOpen(false);
      setActiveTestSubmissionId(null);
      setCurrentQuestionIndex(0);
      setTimerMinutes(timer);
      setTestMode(true);
      toast.success("Test generated! Good luck!");
    } catch (err: any) {
      const msg = err.message || "Could not generate test.";
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

    // Grade MCQ
    const mcq = Array.isArray(testQuestions.multiple_choice) ? testQuestions.multiple_choice : [];
    mcq.forEach((q, i) => {
      total += 1;
      const expected = String(q.answer ?? "")
        .trim()
        .toUpperCase()
        .match(/[A-D]/)?.[0] || "";
      if ((testAnswers[`mcq-${i}`] ?? "") === expected) score += 1;
    });

    // Grade True/False
    const tf = Array.isArray(testQuestions.true_false) ? testQuestions.true_false : [];
    tf.forEach((q, i) => {
      total += 1;
      const expected = typeof q.answer === "boolean" ? (q.answer ? "True" : "False") : String(q.answer);
      if ((testAnswers[`tf-${i}`] ?? "") === expected) score += 1;
    });

    // Grade Short Answer
    const shortAnswer = Array.isArray(testQuestions.short_answer) ? testQuestions.short_answer : [];
    let shortAnswerEvaluations: ShortAnswerEvaluation[] = [];

    if (shortAnswer.length) {
      total += shortAnswer.length;
      const gradeRes = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "grade_short_answers",
          questions: shortAnswer,
          answers: testAnswers,
        }),
      });

      const gradeData = await gradeRes.json().catch(() => ({}));
      if (!gradeRes.ok) {
        setError(gradeData.detail || "Could not grade short answers.");
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
      const data = await res.json().catch(() => ({}));
      const msg = data.detail || "Could not save test submission.";
      setError(msg);
      toast.error(msg);
      return;
    }

    setTestSubmissions((current) => [...current, payload]);
    setAllTestSubmissions((current) => [...current, payload]);
    setTestSubmitted(true);
    setTestScore({ score, total });
    setActiveTestSubmissionId(payload.id);
    setTestMode(false);
    setShowResults(true);

    const percentage = Math.round((score / total) * 100);
    if (percentage >= 70) {
      toast.success(`Great job! You scored ${percentage}%!`);
    } else if (percentage >= 50) {
      toast(`You scored ${percentage}%. Keep practicing!`, { icon: "📚" });
    } else {
      toast(`You scored ${percentage}%. Don't give up!`, { icon: "💪" });
    }
  };

  const openTestSubmission = (testId: string) => {
    let submission = testSubmissions.find((t) => t.id === testId);
    if (!submission) {
      submission = allTestSubmissions.find((t) => t.id === testId);
    }
    if (!submission) return;

    setTestHistoryOpen(false);
    setReviewTestId(testId);
  };

  // Get all questions flattened for test-taking
  const getFlattenedTestQuestions = () => {
    if (!testQuestions) return [];
    const all: any[] = [];

    if (testQuestions.multiple_choice) {
      testQuestions.multiple_choice.forEach((q, i) =>
        all.push({ ...q, type: "mcq", key: `mcq-${i}`, index: i })
      );
    }
    if (testQuestions.true_false) {
      testQuestions.true_false.forEach((q, i) =>
        all.push({ ...q, type: "tf", key: `tf-${i}`, index: i })
      );
    }
    if (testQuestions.short_answer) {
      testQuestions.short_answer.forEach((q, i) =>
        all.push({ ...q, type: "sa", key: `sa-${i}`, index: i })
      );
    }

    return all;
  };

  const flatQuestions = getFlattenedTestQuestions();
  const currentQuestion = flatQuestions[currentQuestionIndex];

  const buildReviewQuestions = (
    questionSet: QuestionSet | null | undefined,
    answers: TestAnswers,
    shortAnswerEvaluations?: ShortAnswerEvaluation[]
  ) => {
    if (!questionSet) return [];
    const results: any[] = [];

    if (questionSet.multiple_choice) {
      questionSet.multiple_choice.forEach((q, i) => {
        const userAnswer = answers[`mcq-${i}`];
        const correct =
          userAnswer === String(q.answer ?? "")
            .trim()
            .toUpperCase()
            .match(/[A-D]/)?.[0];
        results.push({
          question: q.question,
          answer: q.answer,
          userAnswer: userAnswer || "No answer",
          correct,
        });
      });
    }

    if (questionSet.true_false) {
      questionSet.true_false.forEach((q, i) => {
        const userAnswer = answers[`tf-${i}`];
        const correctAnswer =
          typeof q.answer === "boolean" ? (q.answer ? "True" : "False") : String(q.answer);
        results.push({
          statement: q.statement,
          answer: correctAnswer,
          userAnswer: userAnswer || "No answer",
          correct: userAnswer === correctAnswer,
        });
      });
    }

    if (questionSet.short_answer) {
      questionSet.short_answer.forEach((q, i) => {
        const userAnswer = answers[`sa-${i}`];
        const evaluation = shortAnswerEvaluations?.find((e) => e.index === i);
        results.push({
          question: q.question,
          answer: q.answer,
          userAnswer: userAnswer || "No answer",
          correct: evaluation?.correct,
          explanation: evaluation?.feedback,
        });
      });
    }

    return results;
  };

  // Handlers
  const handleSessionHistoryClick = () => {
    setSessionHistoryOpen(!sessionHistoryOpen);
    setTestHistoryOpen(false);
    setMenuOpen(false);
  };

  const handleTestHistoryClick = () => {
    setTestHistoryOpen(!testHistoryOpen);
    setSessionHistoryOpen(false);
    setMenuOpen(false);
  };

  const handleMenuClick = () => {
    setMenuOpen(!menuOpen);
  };

  // ─── Loading state while auth initializes ────────────────────
  if (authLoading) {
    return <LoadingSkeleton />;
  }

  // Render different screens
  if (reviewTestId) {
    let submission = testSubmissions.find((t) => t.id === reviewTestId);
    if (!submission) {
      submission = allTestSubmissions.find((t) => t.id === reviewTestId);
    }
    if (submission) {
      const reviewQuestions = buildReviewQuestions(
        submission.questions,
        submission.answers,
        submission.shortAnswerEvaluations
      );
      return (
        <TestReviewScreen
          questions={reviewQuestions}
          score={submission.score}
          total={submission.total}
          onClose={() => setReviewTestId(null)}
        />
      );
    }
  }

  if (showResults && testScore) {
    const resultQuestions = buildReviewQuestions(
      testQuestions,
      testAnswers,
      testSubmissions.find((t) => t.id === activeTestSubmissionId)?.shortAnswerEvaluations
    );
    return (
      <ResultsScreen
        score={testScore.score}
        total={testScore.total}
        questions={resultQuestions}
        onRetakeTest={() => {
          setShowResults(false);
          setTestSubmitted(false);
          setTestAnswers({});
          setCurrentQuestionIndex(0);
          setTestMode(true);
        }}
        onNewSession={resetSession}
      />
    );
  }

  if (testMode && currentQuestion) {
    return (
      <TestScreen
        questions={flatQuestions}
        questionType={currentQuestion.type}
        currentIndex={currentQuestionIndex}
        totalQuestions={flatQuestions.length}
        answer={testAnswers[currentQuestion.key]}
        onAnswer={(value) =>
          setTestAnswers((prev) => ({ ...prev, [currentQuestion.key]: value }))
        }
        onPrevious={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
        onNext={() =>
          setCurrentQuestionIndex((prev) => Math.min(flatQuestions.length - 1, prev + 1))
        }
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
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#06060b] via-[#0b0b12] to-[#11111a] text-[#f2efff] relative">
      {/* Top Bar */}
      <TopBar 
        onTestHistoryClick={handleTestHistoryClick} 
        onSessionHistoryClick={handleSessionHistoryClick}
        onMenuClick={handleMenuClick} 
      />

      {/* Greeting Banner (shows once per session) */}
      <GreetingBanner />

      {/* Main Content */}
      <div className="pt-16 sm:pt-20 px-3 sm:px-4 pb-20 sm:pb-24 max-w-3xl mx-auto">
        {!testMode && !showResults && (
          <>
            {/* Hero Section */}
            <div className="mb-8">
              {/* Top Row: Made by aawaz (left) + NEW SESSION (right) */}
              <div className="flex items-center justify-between mb-4">
                {/* Made by aawaz - highlighted */}
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-[#a78bfa]/20 to-[#f9a8d4]/20 border border-[#a78bfa]/30">
                  <span className="text-xs font-medium bg-gradient-to-r from-[#a78bfa] to-[#f9a8d4] bg-clip-text text-transparent">
                    ✨ made by aawaz
                  </span>
                </div>

                {/* NEW SESSION Button - Top Right */}
                <motion.button
                  whileTap={{ scale: 0.95, opacity: 0.6 }}
                  onClick={() => {
                    const hasContent = text.trim() || attachments.length > 0 || generations.length > 0;
                    if (!hasContent && !sessionId) {
                      toast("Please use your current session first", { icon: "📝" });
                      return;
                    }
                    resetSession();
                    toast.success("New session started.");
                  }}
                  disabled={loading || uploading}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-xs tracking-wide bg-white/5 border border-white/10 text-[#ddd6fe] hover:bg-white/8 active:bg-white/12 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <X className="w-3.5 h-3.5" />
                  NEW SESSION
                </motion.button>
              </div>

              {/* Title and Help - Centered */}
              <div className="text-center">
                <div className="flex items-center justify-center gap-3 mb-3">
                  <Sparkles className="w-6 h-6 text-[#a78bfa]" />
                  <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-[#a78bfa] to-[#f9a8d4] bg-clip-text text-transparent">
                    Study Buddy
                  </h1>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 15 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setHelpOpen(!helpOpen)}
                    className="p-2 rounded-full hover:bg-white/10 transition-colors"
                    aria-label="Help"
                  >
                    <CircleHelp className={`w-5 h-5 transition-colors ${helpOpen ? 'text-[#a78bfa]' : 'text-[#f9a8d4]'}`} />
                  </motion.button>
                </div>
                <p className="text-[#857ca2] text-sm">
                  Turn notes into smart questions with AI
                </p>
                {!user && (
                  <p className="text-[#a78bfa]/70 text-xs mt-2">
                    Sign in to save your progress and history
                  </p>
                )}
              </div>

              {/* TAKE TEST Button - Centered, only show if has questions */}
              {hasResults && (
                <div className="mt-6 flex justify-center">
                  <motion.button
                    whileTap={{ scale: 0.95, opacity: 0.6 }}
                    onClick={() => setTestOptionsOpen(true)}
                    disabled={loading || uploading}
                    className="inline-flex items-center gap-2 min-h-[48px] px-6 py-3 rounded-2xl font-medium text-sm tracking-wide bg-gradient-to-r from-[#a78bfa] to-[#f9a8d4] text-white shadow-lg active:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <BookOpen className="w-4 h-4" />
                    TAKE TEST
                  </motion.button>
                </div>
              )}
            </div>

            {/* Help Modal */}
            <AnimatePresence>
              {helpOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  className="mb-6 p-6 bg-gradient-to-br from-[#a78bfa]/10 to-[#f9a8d4]/10 border border-[#a78bfa]/30 rounded-2xl relative backdrop-blur-sm shadow-xl shadow-[#a78bfa]/5"
                >
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setHelpOpen(false)}
                    className="absolute top-3 right-3 p-2 rounded-full bg-red-500/20 hover:bg-red-500/40 transition-colors"
                    aria-label="Close help"
                  >
                    <X className="w-4 h-4 text-red-400" />
                  </motion.button>
                  
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 rounded-lg bg-[#a78bfa]/20">
                      <CircleHelp className="w-5 h-5 text-[#a78bfa]" />
                    </div>
                    <h3 className="text-lg font-semibold bg-gradient-to-r from-[#a78bfa] to-[#f9a8d4] bg-clip-text text-transparent">
                      How to Use Study Buddy
                    </h3>
                  </div>
                  
                  <div className="space-y-3 text-sm text-[#ddd6fe] leading-relaxed pr-8">
                    <div className="flex gap-3">
                      <span className="text-[#a78bfa] font-bold">1.</span>
                      <p>Start a session with <strong className="text-[#f9a8d4]">one source type</strong>: pasted notes, a PDF, or photos (max 3).</p>
                    </div>
                    <div className="flex gap-3">
                      <span className="text-[#a78bfa] font-bold">2.</span>
                      <p>Adjust <strong className="text-[#f9a8d4]">difficulty</strong> and <strong className="text-[#f9a8d4]">question format</strong>, then generate questions.</p>
                    </div>
                    <div className="flex gap-3">
                      <span className="text-[#a78bfa] font-bold">3.</span>
                      <p>Use <strong className="text-[#f9a8d4]">TAKE TEST</strong> to quiz yourself. Answer first, then submit to see results.</p>
                    </div>
                    <div className="flex gap-3">
                      <span className="text-[#a78bfa] font-bold">4.</span>
                      <p>View test history in the <strong className="text-[#f9a8d4]">right sidebar</strong> to review past attempts anytime.</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Session Form */}
            <SessionForm
              text={text}
              onTextChange={handleTextChange}
              attachments={attachments}
              onFilesAdded={handleFilesAdded}
              onRemoveAttachment={(id) =>
                setAttachments((prev) => prev.filter((a) => a.id !== id))
              }
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

            {/* Generated Questions */}
            {hasResults && questions && (
              <GeneratedQuestionsView
                questions={questions}
                difficulty={difficulty}
                mode={mode}
              />
            )}
          </>
        )}
      </div>

      {/* Session History Sidebar (LEFT) */}
      <Sidebar
        isOpen={sessionHistoryOpen}
        onClose={() => setSessionHistoryOpen(false)}
        side="left"
        title="Sessions"
      >
        <SessionHistoryList
          sessions={history}
          currentSessionId={sessionId}
          currentSessionTitle={sessionTitle}
          currentGenerations={generationItems}
          activeGenerationId={activeGenerationId}
          onSelectSession={(id) => {
            openSession(id);
          }}
          onDeleteSession={(id) => {
            deleteSession(id);
          }}
          onSelectGeneration={(id) => {
            const gen = generations.find((g) => g.id === id);
            if (gen) {
              setActiveGenerationId(id);
              setQuestions(gen.questions);
              setDifficulty(gen.difficulty as "easy" | "medium" | "difficult");
              setMode(gen.mode);
              setSessionHistoryOpen(false);
            }
          }}
          loading={historyLoading}
          actionLoading={actionLoading}
          deletingSessionId={deletingSessionId}
        />
      </Sidebar>

      {/* Test History Sidebar (RIGHT) */}
      <Sidebar
        isOpen={testHistoryOpen}
        onClose={() => setTestHistoryOpen(false)}
        side="right"
        title="Test History"
      >
        <TestHistoryList
          tests={testHistoryItems}
          onSelectTest={openTestSubmission}
          loading={historyLoading}
        />
      </Sidebar>

      {/* Test Options Bottom Sheet */}
      <BottomSheet isOpen={testOptionsOpen} onClose={() => setTestOptionsOpen(false)}>
        <TestOptionsSheet
          onSelect={(optionId, timerMins) => {
            setTestOptionsOpen(false);
            startTest(optionId, timerMins);
          }}
        />
      </BottomSheet>

      {/* Menu Bottom Sheet */}
      <BottomSheet isOpen={menuOpen} onClose={() => setMenuOpen(false)}>
        <div className="py-4">
          <h3 className="text-xl font-bold text-[#f2efff] mb-4">Menu</h3>
          <div className="space-y-2">
            {/* Take Test Option */}
            {hasResults && (
              <motion.button
                whileTap={{ scale: 0.98, opacity: 0.6 }}
                onClick={() => {
                  setMenuOpen(false);
                  setTestOptionsOpen(true);
                }}
                disabled={loading || uploading}
                className="w-full text-left p-4 rounded-xl bg-gradient-to-r from-[#a78bfa]/20 to-[#f9a8d4]/20 border border-[#a78bfa]/30 hover:bg-[#a78bfa]/30 active:bg-[#a78bfa]/40 transition-colors text-[#f2efff] flex items-center gap-3 disabled:opacity-40"
              >
                <BookOpen className="w-5 h-5 text-[#a78bfa]" />
                <div>
                  <span className="font-medium">Take Test</span>
                  <p className="text-xs text-[#857ca2] mt-0.5">Start a timed quiz</p>
                </div>
              </motion.button>
            )}

            {/* View Sessions */}
            <motion.button
              whileTap={{ scale: 0.98, opacity: 0.6 }}
              onClick={() => {
                setMenuOpen(false);
                handleSessionHistoryClick();
              }}
              className="w-full text-left p-4 rounded-xl bg-white/5 hover:bg-white/8 active:bg-white/12 transition-colors text-[#ddd6fe] flex items-center gap-3"
            >
              <LayoutPanelLeft className="w-5 h-5 text-[#857ca2]" />
              <div>
                <span className="font-medium">Session Generations</span>
                <p className="text-xs text-[#857ca2] mt-0.5">View question sets from this session</p>
              </div>
            </motion.button>

            {/* View Test History */}
            <motion.button
              whileTap={{ scale: 0.98, opacity: 0.6 }}
              onClick={() => {
                setMenuOpen(false);
                handleTestHistoryClick();
              }}
              className="w-full text-left p-4 rounded-xl bg-white/5 hover:bg-white/8 active:bg-white/12 transition-colors text-[#ddd6fe] flex items-center gap-3"
            >
              <Trophy className="w-5 h-5 text-[#857ca2]" />
              <div>
                <span className="font-medium">Test History</span>
                <p className="text-xs text-[#857ca2] mt-0.5">Review past test scores</p>
              </div>
            </motion.button>

            {/* New Session */}
            <motion.button
              whileTap={{ scale: 0.98, opacity: 0.6 }}
              onClick={() => {
                setMenuOpen(false);
                resetSession();
              }}
              className="w-full text-left p-4 rounded-xl bg-white/5 hover:bg-white/8 active:bg-white/12 transition-colors text-[#ddd6fe] flex items-center gap-3"
            >
              <X className="w-5 h-5 text-[#857ca2]" />
              <div>
                <span className="font-medium">New Session</span>
                <p className="text-xs text-[#857ca2] mt-0.5">Start fresh with new content</p>
              </div>
            </motion.button>
          </div>
        </div>
      </BottomSheet>

      {/* Full-screen loading overlay for generation */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#0b0b12] border border-white/10 rounded-2xl p-8 flex flex-col items-center gap-4 shadow-2xl"
            >
              <Loader2 className="w-10 h-10 text-[#a78bfa] animate-spin" />
              <p className="text-sm text-[#ddd6fe] font-medium">Generating with AI...</p>
              <p className="text-xs text-[#857ca2]">This may take a few seconds</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
