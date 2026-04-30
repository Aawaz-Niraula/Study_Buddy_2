"use client";

import { useState, useCallback } from "react";

export type SourceKind = "text" | "pdf" | "image" | null;
export type Attachment = {
  id: string;
  name: string;
  type: "pdf" | "image";
  extractedText?: string;
  mimeType: string;
  dataUrl?: string;
  origin: "upload" | "camera";
};
export type QuestionSet = {
  multiple_choice?: unknown[];
  short_answer?: unknown[];
  true_false?: unknown[];
  flashcards?: unknown[];
};
export type Generation = {
  id: string;
  created_at: string;
  mode: string;
  difficulty: string;
  questions: QuestionSet;
};
export type SessionListItem = {
  id: string;
  title: string;
  updated_at: string;
  latest_mode: string;
  latest_difficulty: string;
  source_kind: string;
};
export type TestAnswers = Record<string, string>;
export type ShortAnswerEvaluation = {
  index?: number;
  correct?: boolean;
  feedback?: string;
};
export type TestSubmission = {
  id: string;
  created_at: string;
  score: number;
  total: number;
  answers: TestAnswers;
  questions: QuestionSet;
  shortAnswerEvaluations?: ShortAnswerEvaluation[];
};

export function useSessionState() {
  // Session state
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionTitle, setSessionTitle] = useState("New session");
  const [sourceKind, setSourceKind] = useState<SourceKind>(null);
  const [text, setText] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [mode, setMode] = useState("mix");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "difficult">("medium");
  const [questionCount, setQuestionCount] = useState(5);

  // Questions state
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
  const [currentTestQuestion, setCurrentTestQuestion] = useState(0);

  // UI state
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [error, setError] = useState("");

  const resetSession = useCallback(() => {
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
    setCurrentTestQuestion(0);
  }, []);

  const hasResults = !!(
    questions &&
    ((questions.multiple_choice?.length ?? 0) > 0 ||
      (questions.short_answer?.length ?? 0) > 0 ||
      (questions.true_false?.length ?? 0) > 0 ||
      (questions.flashcards?.length ?? 0) > 0)
  );

  return {
    // State
    sessionId,
    setSessionId,
    sessionTitle,
    setSessionTitle,
    sourceKind,
    setSourceKind,
    text,
    setText,
    attachments,
    setAttachments,
    mode,
    setMode,
    difficulty,
    setDifficulty,
    questionCount,
    setQuestionCount,
    questions,
    setQuestions,
    generations,
    setGenerations,
    activeGenerationId,
    setActiveGenerationId,
    testMode,
    setTestMode,
    testQuestions,
    setTestQuestions,
    testAnswers,
    setTestAnswers,
    testSubmitted,
    setTestSubmitted,
    testScore,
    setTestScore,
    testSubmissions,
    setTestSubmissions,
    activeTestSubmissionId,
    setActiveTestSubmissionId,
    currentTestQuestion,
    setCurrentTestQuestion,
    loading,
    setLoading,
    uploading,
    setUploading,
    uploadStatus,
    setUploadStatus,
    error,
    setError,

    // Computed
    hasResults,

    // Methods
    resetSession,
  };
}
