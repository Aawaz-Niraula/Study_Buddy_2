// Shared helper to flatten a graded test submission into review rows.

type QuestionItem = {
  question?: string;
  statement?: string;
  answer?: string | boolean;
  options?: string[];
};
type QuestionSet = {
  multiple_choice?: QuestionItem[];
  short_answer?: QuestionItem[];
  true_false?: QuestionItem[];
};
type Answers = Record<string, string>;
type Evals = { index?: number; correct?: boolean; feedback?: string }[];

export type ReviewRow = {
  question?: string;
  statement?: string;
  answer: string;
  userAnswer: string;
  correct?: boolean;
  explanation?: string;
};

export function buildReviewRows(
  questionSet: QuestionSet | null | undefined,
  answers: Answers = {},
  shortAnswerEvaluations?: Evals
): ReviewRow[] {
  if (!questionSet) return [];
  const rows: ReviewRow[] = [];
  questionSet.multiple_choice?.forEach((q, i) => {
    const userAnswer = answers[`mcq-${i}`];
    rows.push({
      question: q.question,
      answer: String(q.answer ?? ""),
      userAnswer: userAnswer || "No answer",
      correct: userAnswer === String(q.answer ?? "").trim().toUpperCase().match(/[A-D]/)?.[0],
    });
  });
  questionSet.true_false?.forEach((q, i) => {
    const userAnswer = answers[`tf-${i}`];
    const correctAnswer = typeof q.answer === "boolean" ? (q.answer ? "True" : "False") : String(q.answer);
    rows.push({
      statement: q.statement,
      answer: correctAnswer,
      userAnswer: userAnswer || "No answer",
      correct: userAnswer === correctAnswer,
    });
  });
  questionSet.short_answer?.forEach((q, i) => {
    const userAnswer = answers[`sa-${i}`];
    const evaluation = shortAnswerEvaluations?.find((e) => e.index === i);
    rows.push({
      question: q.question,
      answer: String(q.answer ?? ""),
      userAnswer: userAnswer || "No answer",
      correct: evaluation?.correct,
      explanation: evaluation?.feedback,
    });
  });
  return rows;
}

export type WrongCounts = { mcq: number; tf: number; sa: number };

/** Count wrong answers by type for a single graded submission. */
export function countWrongByType(
  questionSet: QuestionSet | null | undefined,
  answers: Answers = {},
  shortAnswerEvaluations?: Evals
): WrongCounts {
  const counts: WrongCounts = { mcq: 0, tf: 0, sa: 0 };
  if (!questionSet) return counts;
  questionSet.multiple_choice?.forEach((q, i) => {
    const expected = String(q.answer ?? "").trim().toUpperCase().match(/[A-D]/)?.[0] || "";
    if ((answers[`mcq-${i}`] ?? "") !== expected) counts.mcq += 1;
  });
  questionSet.true_false?.forEach((q, i) => {
    const expected = typeof q.answer === "boolean" ? (q.answer ? "True" : "False") : String(q.answer);
    if ((answers[`tf-${i}`] ?? "") !== expected) counts.tf += 1;
  });
  questionSet.short_answer?.forEach((_q, i) => {
    const evaluation = shortAnswerEvaluations?.find((e) => e.index === i);
    if (evaluation && evaluation.correct === false) counts.sa += 1;
  });
  return counts;
}
