"use client";

import { useState } from "react";
import { TopBar } from "@/components/TopBar";
import { Sidebar } from "@/components/Sidebar";
import { BottomSheet } from "@/components/BottomSheet";
import { ContextAwareButton } from "@/components/ContextAwareButton";
import { SessionForm } from "@/components/SessionForm";
import { TestOptionsSheet } from "@/components/TestOptionsSheet";
import { SessionHistoryList, type SessionItem } from "@/components/SessionHistoryList";
import { TestHistoryList, type TestSubmissionItem } from "@/components/TestHistoryList";
import { TestScreen } from "@/components/TestScreen";
import { ResultsScreen } from "@/components/ResultsScreen";
import { TestReviewScreen } from "@/components/TestReviewScreen";
import { Sparkles, CircleHelp, X } from "lucide-react";

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

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_PDF_SIZE_BYTES = 3 * 1024 * 1024;

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
};

let pdfJsLoader: Promise<void> | null = null;

function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`) as HTMLScriptElement | null;
    if (existing)
      return existing.dataset.loaded === "true"
        ? resolve()
        : existing.addEventListener("load", () => resolve(), { once: true });
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.crossOrigin = "anonymous";
    script.onload = () => {
      script.dataset.loaded = "true";
      resolve();
    };
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.head.appendChild(script);
  });
}

async function extractPdfText(file: File) {
  if (!pdfJsLoader) {
    pdfJsLoader = loadScript(
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"
    ).then(() => {
      if (!window.pdfjsLib) throw new Error("PDF reader failed to load.");
      window.pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
    });
  }
  await pdfJsLoader;
  if (!window.pdfjsLib) throw new Error("PDF reader is unavailable.");
  const pdf = await window.pdfjsLib.getDocument({
    data: new Uint8Array(await file.arrayBuffer()),
  }).promise;
  const pages: string[] = [];
  for (let n = 1; n <= pdf.numPages; n += 1) {
    const content = await (await pdf.getPage(n)).getTextContent();
    pages.push(
      content.items
        .map((item) => item.str?.trim() ?? "")
        .filter(Boolean)
        .join(" ")
    );
  }
  return pages.join("\n");
}

async function fileToDataUrl(file: File) {
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      typeof reader.result === "string"
        ? resolve(reader.result)
        : reject(new Error("Could not read image file."));
    reader.onerror = () => reject(new Error("Could not read image file."));
    reader.readAsDataURL(file);
  });
}

export default function Home() {
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

  // Computed values
  const hasResults = !!(
    questions &&
    ((questions.multiple_choice?.length ?? 0) > 0 ||
      (questions.short_answer?.length ?? 0) > 0 ||
      (questions.true_false?.length ?? 0) > 0 ||
      (questions.flashcards?.length ?? 0) > 0)
  );

  const getButtonState = (): "new-session" | "take-test" | "see-results" => {
    if (showResults && testSubmitted) return "see-results";
    if (sessionId && hasResults) return "take-test";
    return "new-session";
  };

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
  };

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch("/api/generate");
      const data = await res.json().catch(() => ({}));
      setHistory(Array.isArray(data.sessions) ? data.sessions : []);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleFilesAdded = async (
    event: React.ChangeEvent<HTMLInputElement>,
    origin: "upload" | "camera"
  ) => {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;

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

      const parsed: Attachment[] = [];
      for (const file of files) {
        const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
        const isImage = file.type.startsWith("image/");

        if (incomingKind === "pdf" && !isPdf) throw new Error("PDF sessions can only contain a PDF.");
        if (incomingKind === "image" && !isImage)
          throw new Error("Photo sessions can only contain images.");
        if (isPdf && file.size > MAX_PDF_SIZE_BYTES) throw new Error(`${file.name}: PDF is too large.`);
        if (isImage && file.size > MAX_IMAGE_SIZE_BYTES)
          throw new Error(`${file.name}: image is too large.`);

        parsed.push({
          id: `${file.name}-${file.size}-${file.lastModified}`,
          name: file.name,
          type: isPdf ? "pdf" : "image",
          extractedText: isPdf ? (await extractPdfText(file)).trim() : undefined,
          mimeType: file.type || (isPdf ? "application/pdf" : "image/jpeg"),
          dataUrl: isImage ? await fileToDataUrl(file) : undefined,
          origin,
        });
      }

      setAttachments((current) => [...current, ...parsed]);
      setSourceKind(incomingKind);
      setSessionTitle(parsed[0]?.name || "File session");
      setUploadStatus(`Added ${parsed.length} file${parsed.length === 1 ? "" : "s"}.`);
    } catch (err: any) {
      setError(err.message || "Could not read the selected file.");
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

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || "Could not generate questions.");

      setSessionId(data.sessionId ?? sessionId);
      setQuestions(data.questions ?? null);

      const generationId = `${Date.now()}`;
      setGenerations((current) => [
        ...current,
        {
          id: generationId,
          created_at: new Date().toISOString(),
          mode,
          difficulty,
          questions: data.questions ?? {},
        },
      ]);
      setActiveGenerationId(generationId);

      if (sessionHistoryOpen) await loadHistory();
    } catch (err: any) {
      setError(err.message || "Could not generate questions.");
    } finally {
      setLoading(false);
    }
  };

  const openSession = async (id: string) => {
    setError("");
    const res = await fetch(`/api/generate?sessionId=${encodeURIComponent(id)}`);
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setError(data.detail || "Could not open session.");
      return;
    }

    const session = data.session;
    setSessionId(session.id);
    setSessionTitle(session.title);
    setSourceKind(session.source_kind);
    setMode(session.latest_mode ?? "mix");
    setDifficulty(session.latest_difficulty ?? "medium");
    setText("");
    setAttachments(session.source_payload?.attachments ?? []);
    setGenerations(Array.isArray(session.generations) ? session.generations : []);
    setQuestions(session.latest_generation?.questions ?? null);
    setActiveGenerationId(session.latest_generation?.id ?? null);
    setTestSubmissions(Array.isArray(session.test_submissions) ? session.test_submissions : []);
    setUploadStatus("");
    setSessionHistoryOpen(false);
    setTestMode(false);
    setTestQuestions(null);
    setTestAnswers({});
    setTestSubmitted(false);
    setTestScore(null);
    setShowResults(false);
  };

  const deleteSession = async (id: string) => {
    const res = await fetch(`/api/generate?sessionId=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    if (res.ok) {
      if (sessionId === id) resetSession();
      await loadHistory();
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
    } catch (err: any) {
      setError(err.message || "Could not generate test.");
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
    };

    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "submit_test", sessionId, submission: payload }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.detail || "Could not save test submission.");
      return;
    }

    setTestSubmissions((current) => [...current, payload]);
    setTestSubmitted(true);
    setTestScore({ score, total });
    setActiveTestSubmissionId(payload.id);
    setTestMode(false);
    setShowResults(true);
  };

  const openTestSubmission = (testId: string) => {
    const submission = testSubmissions.find((t) => t.id === testId);
    if (!submission) return;

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

  // Get results for ResultsScreen
  const getResultQuestions = () => {
    if (!testQuestions || !testSubmitted) return [];

    const results: any[] = [];
    const activeSubmission = testSubmissions.find((t) => t.id === activeTestSubmissionId);

    if (testQuestions.multiple_choice) {
      testQuestions.multiple_choice.forEach((q, i) => {
        const userAnswer = testAnswers[`mcq-${i}`];
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

    if (testQuestions.true_false) {
      testQuestions.true_false.forEach((q, i) => {
        const userAnswer = testAnswers[`tf-${i}`];
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

    if (testQuestions.short_answer) {
      testQuestions.short_answer.forEach((q, i) => {
        const userAnswer = testAnswers[`sa-${i}`];
        const evaluation = activeSubmission?.shortAnswerEvaluations?.find((e) => e.index === i);
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
  const handleContextButtonClick = () => {
    const state = getButtonState();
    if (state === "new-session") {
      resetSession();
    } else if (state === "take-test") {
      setTestOptionsOpen(true);
    } else if (state === "see-results") {
      setShowResults(true);
    }
  };

  const handleSessionHistoryClick = () => {
    if (!sessionHistoryOpen && history.length === 0) {
      loadHistory();
    }
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

  // Render different screens
  if (reviewTestId) {
    const submission = testSubmissions.find((t) => t.id === reviewTestId);
    if (submission) {
      const reviewQuestions = getResultQuestions();
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
    const resultQuestions = getResultQuestions();
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
      <TopBar onHistoryClick={handleTestHistoryClick} onMenuClick={handleMenuClick} />

      {/* Main Content */}
      <div className="pt-20 px-4 pb-24 max-w-3xl mx-auto">
        {!testMode && !showResults && (
          <>
            {/* Hero Section */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-3 mb-3">
                <Sparkles className="w-6 h-6 text-[#a78bfa]" />
                <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-[#a78bfa] to-[#f9a8d4] bg-clip-text text-transparent">
                  Study Buddy
                </h1>
                <button
                  onClick={() => setHelpOpen(true)}
                  className="p-2 rounded-full hover:bg-white/5 transition-colors"
                  aria-label="Help"
                >
                  <CircleHelp className="w-5 h-5 text-[#f9a8d4]" />
                </button>
              </div>
              <p className="text-[#857ca2] text-sm mb-4">
                Turn notes into smart questions with AI
              </p>
              <p className="text-[#857ca2] text-xs">
                made by aawaz
              </p>
            </div>

            {/* Context-Aware Primary Button - scrolls with content */}
            <div className="mb-6">
              <ContextAwareButton state={getButtonState()} onClick={handleContextButtonClick} />
            </div>

            {/* Help Modal */}
            {helpOpen && (
              <div className="mb-6 p-6 bg-white/5 border border-white/10 rounded-2xl relative">
                <button
                  onClick={() => setHelpOpen(false)}
                  className="absolute top-4 right-4 p-2 rounded-full bg-red-500/20 hover:bg-red-500/30 transition-colors"
                  aria-label="Close help"
                >
                  <X className="w-4 h-4 text-red-400" />
                </button>
                <h3 className="text-sm font-medium text-[#f9a8d4] uppercase tracking-wide mb-3">
                  How to Use
                </h3>
                <div className="text-sm text-[#ddd6fe] leading-relaxed pr-8">
                  Start one session with only one source type: pasted notes, one PDF, or one or more photos. 
                  After that, you can change difficulty and question format as many times as you want for that 
                  same session. Use TAKE TEST to build a test from this session or blend in previous sessions. 
                  In test mode you answer first, then press SUBMIT TEST and use SEE RESULTS to reveal scoring 
                  and correct answers. TEST HISTORY opens a sidebar with previous submissions you can reopen anytime.
                </div>
              </div>
            )}

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
              error={error}
              uploadStatus={uploadStatus}
            />

            {/* Generated Questions Display (simplified for now) */}
            {hasResults && (
              <div className="mt-8 p-6 bg-white/5 border border-white/10 rounded-2xl text-center">
                <p className="text-[#ddd6fe] mb-2">
                  ✓ Questions generated successfully!
                </p>
                <p className="text-sm text-[#857ca2]">
                  Use "TAKE TEST" to start practicing
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Session History Sidebar */}
      <Sidebar
        isOpen={sessionHistoryOpen}
        onClose={() => setSessionHistoryOpen(false)}
        side="left"
        title="Sessions"
      >
        <SessionHistoryList
          sessions={history}
          onSelectSession={openSession}
          loading={historyLoading}
        />
      </Sidebar>

      {/* Test History Sidebar */}
      <Sidebar
        isOpen={testHistoryOpen}
        onClose={() => setTestHistoryOpen(false)}
        side="right"
        title="Test History"
      >
        <TestHistoryList
          tests={testSubmissions.map((t) => ({
            id: t.id,
            created_at: t.created_at,
            score: t.score,
            total: t.total,
          }))}
          onSelectTest={openTestSubmission}
          loading={false}
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

      {/* Menu Bottom Sheet (placeholder) */}
      <BottomSheet isOpen={menuOpen} onClose={() => setMenuOpen(false)}>
        <div className="py-4">
          <h3 className="text-xl font-bold text-[#f2efff] mb-4">Menu</h3>
          <div className="space-y-2">
            <button
              onClick={handleSessionHistoryClick}
              className="w-full text-left p-4 rounded-xl bg-white/5 hover:bg-white/8 transition-colors text-[#ddd6fe]"
            >
              View Sessions
            </button>
            <button
              onClick={handleTestHistoryClick}
              className="w-full text-left p-4 rounded-xl bg-white/5 hover:bg-white/8 transition-colors text-[#ddd6fe]"
            >
              Test History
            </button>
          </div>
        </div>
      </BottomSheet>
    </main>
  );
}
