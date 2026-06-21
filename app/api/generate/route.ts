import { createClient } from "@libsql/client";
import { del } from "@vercel/blob";
import { getAuthenticatedUserId } from "@/lib/supabase-api-auth";

const PRIMARY_MODEL = process.env.DEEPINFRA_MODEL || "google/gemma-4-26B-A4B-it";
const DEEPINFRA_BASE_URL = "https://api.deepinfra.com/v1/openai";
const ALLOWED_MODES = new Set(["multiple-choice", "flashcard", "short-answer", "true-false", "mix"]);
const ALLOWED_DIFFICULTIES = new Set(["easy", "medium", "difficult"]);
const MAX_TEXT_SOURCE_CHARS = 12000;
const APPROX_CHARS_PER_TOKEN = 4;
const MAX_PDF_PROMPT_TOKENS = 4000;
const MAX_PDF_PROMPT_CHARS = MAX_PDF_PROMPT_TOKENS * APPROX_CHARS_PER_TOKEN;
const PDF_SAMPLE_SECTIONS = 4;

const SYSTEM_PROMPT = `You are a university-level study assistant. Generate high-quality study questions targeting key concepts.

You MUST output valid JSON only with no markdown, code fences, or explanation.

Output format:
{
  "multiple_choice": [{"question": "", "options": ["A) ...", "B) ...", "C) ...", "D) ..."], "answer": "A"}],
  "short_answer": [{"question": "", "answer": ""}],
  "true_false": [{"statement": "", "answer": "True"}],
  "flashcards": [{"question": "", "answer": ""}]
}`;

const AAWAX_SYSTEM_PROMPT = `You are Aawax, the friendly mascot and study buddy who lives inside the "Study Buddy" app.

Personality and rules:
- You are warm, encouraging, patient, and a little playful. You talk like a supportive friend, not a textbook.
- Keep replies concise and easy to read. Use short paragraphs. Avoid long bullet dumps unless the student asks for steps.
- Never use em dashes. Write the way a friendly person texts.
- You help students understand their study material, explain concepts simply, and motivate them.
- You were created by Aawaz, an enthusiastic developer who also built "Aawaz Speaker Coach". If asked who made you, mention Aawaz warmly.
- You know you live in the Study Buddy app, which turns notes, PDFs, and photos into study questions and tests.
- You can see the student's recent test scores and the kinds of questions they get wrong (provided below). Use this to answer questions like "what is my score trend", "where do I need to improve", and "what kind of questions do I get wrong".
- When a student gets a question wrong and asks you to elaborate, explain the correct answer clearly and kindly, then give one quick tip to remember it.
- If you do not have enough data about the student, say so gently and encourage them to take a few tests.`;


type AttachmentPayload = {
  name?: string;
  type?: "pdf" | "image" | "document";
  extractedText?: string;
  dataUrl?: string;
  blobUrl?: string;
  mimeType?: string;
  origin?: "upload" | "camera";
};

type SourcePayload =
  | { text: string }
  | { text: string; attachments: Array<{ name?: string; type?: "pdf" | "image" | "document" }> }
  | { attachments: AttachmentPayload[] };

let schemaReadyPromise: Promise<unknown> | undefined;

// ─── Rate limiting & concurrency ───────────────────────────────
const GUEST_USE_LIMIT = 3; // total AI uses allowed without an account
const ACCOUNT_RATE_LIMIT = 40; // AI requests per window per account
const ACCOUNT_RATE_WINDOW_MS = 60_000;
const MAX_CONCURRENT_AI = 50; // provider can handle this many at once

// Actions that hit the AI provider (gated by concurrency + counted for guests).
const HEAVY_ACTIONS = new Set(["generate", "generate_test", "grade_short_answers", "chat"]);
// Actions counted against a guest's free-use budget.
const GUEST_COUNTED_ACTIONS = new Set(["generate", "generate_test", "chat"]);

// In-memory concurrency counter (per serverless instance).
let inFlightAI = 0;

// In-memory fixed-window rate limiter (per serverless instance).
const accountHits = new Map<string, { count: number; resetAt: number }>();

function checkAccountRate(userId: string): boolean {
  const now = Date.now();
  const rec = accountHits.get(userId);
  if (!rec || now > rec.resetAt) {
    accountHits.set(userId, { count: 1, resetAt: now + ACCOUNT_RATE_WINDOW_MS });
    return true;
  }
  if (rec.count >= ACCOUNT_RATE_LIMIT) return false;
  rec.count += 1;
  return true;
}

function getClientIp(request: Request): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

async function getGuestUsage(ip: string): Promise<number> {
  const db = getDbClient();
  if (!db) return 0;
  await ensureSchema(db);
  const r = await db.execute({ sql: `SELECT count FROM guest_usage WHERE ip = ? LIMIT 1`, args: [ip] });
  return r.rows[0] ? Number(r.rows[0].count) : 0;
}

async function incrGuestUsage(ip: string): Promise<void> {
  const db = getDbClient();
  if (!db) return;
  await ensureSchema(db);
  const now = new Date().toISOString();
  await db.execute({
    sql: `INSERT INTO guest_usage (ip, count, updated_at) VALUES (?, 1, ?)
          ON CONFLICT(ip) DO UPDATE SET count = count + 1, updated_at = ?`,
    args: [ip, now, now],
  });
}

// ─── Helpers ───────────────────────────────────────────────────
function makeResponse(status: number, body: unknown) {
  return Response.json(body, {
    status,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    },
  });
}

function buildModeInstruction(mode: string) {
  const instructions: Record<string, string> = {
    "multiple-choice": "Generate 8 to 10 multiple-choice questions only. Set all other arrays to [].",
    flashcard: "Generate 10 to 15 flashcards only. Set all other arrays to [].",
    "short-answer": "Generate 10 short-answer questions only. Set all other arrays to [].",
    "true-false": "Generate 12 true/false questions only. Set all other arrays to [].",
    mix: "Generate a balanced mix: 4 multiple-choice, 3 short-answer, 3 true/false, and 4 flashcards.",
  };
  return instructions[mode] ?? instructions.mix;
}

function buildDifficultyInstruction(difficulty: string) {
  const instructions: Record<string, string> = {
    easy: "Keep questions straightforward and easier to answer.",
    medium: "Keep questions balanced with moderate reasoning and concept application.",
    difficult: "Make questions more challenging with deeper reasoning and nuance.",
  };
  return instructions[difficulty] ?? instructions.medium;
}

function buildTextPrompt(mode: string, difficulty: string, sourceLabel: string, text: string) {
  return `${buildModeInstruction(mode)}
${buildDifficultyInstruction(difficulty)}

Source type: ${sourceLabel}

Source text:
${text.trim()}`;
}

function compactWhitespace(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function trimPdfText(text: string) {
  const normalized = compactWhitespace(text);
  if (normalized.length <= MAX_PDF_PROMPT_CHARS) return normalized;
  const sectionSize = Math.floor(MAX_PDF_PROMPT_CHARS / PDF_SAMPLE_SECTIONS);
  const lastStart = Math.max(0, normalized.length - sectionSize);
  const starts = Array.from({ length: PDF_SAMPLE_SECTIONS }, (_, index) => {
    const ratio = index / (PDF_SAMPLE_SECTIONS - 1);
    return Math.min(lastStart, Math.max(0, Math.floor(ratio * lastStart)));
  });

  return starts
    .map((start) => normalized.slice(start, start + sectionSize).trim())
    .filter(Boolean)
    .join("\n...\n");
}

function buildVisionPrompt(mode: string, difficulty: string, attachments: AttachmentPayload[]) {
  return `${buildModeInstruction(mode)}
${buildDifficultyInstruction(difficulty)}

Source type: image/photo
Image files: ${attachments.map((item) => item.name).join(", ")}

Look carefully at the images and generate study questions from the visible material.`;
}

function buildDocumentSourceLabel(sourceKind: string) {
  if (sourceKind === "pdf") return "pdf";
  if (sourceKind === "document") return "document";
  return "notes";
}

function normalizeQuestionSet(data: unknown) {
  const normalized = typeof data === "object" && data !== null ? (data as Record<string, unknown>) : {};
  for (const key of ["multiple_choice", "short_answer", "true_false", "flashcards"]) {
    if (!Array.isArray(normalized[key])) normalized[key] = [];
  }
  return normalized;
}

function parseModelJson(rawContent: string) {
  const stripped = String(rawContent).replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  const start = stripped.indexOf("{");
  const end = stripped.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) throw new Error("No JSON object found in model response");
  return JSON.parse(stripped.slice(start, end + 1));
}

function getImageSourceUrl(item: AttachmentPayload) {
  const blobUrl = typeof item.blobUrl === "string" ? item.blobUrl.trim() : "";
  if (blobUrl) return blobUrl;
  const dataUrl = typeof item.dataUrl === "string" ? item.dataUrl.trim() : "";
  return dataUrl;
}

function isTrustedBlobUrl(url: string): boolean {
  try {
    const { hostname, protocol } = new URL(url);
    if (protocol !== "https:") return false;
    return (
      hostname.endsWith(".blob.vercel-storage.com") ||
      hostname.endsWith(".public.blob.vercel-storage.com")
    );
  } catch {
    return false;
  }
}

function getSessionImageBlobUrls(sourcePayload: SourcePayload): string[] {
  const attachments = Array.isArray((sourcePayload as { attachments?: AttachmentPayload[] }).attachments)
    ? (sourcePayload as { attachments: AttachmentPayload[] }).attachments
    : [];

  return attachments
    .filter((item) => item?.type === "image")
    .map((item) => (typeof item.blobUrl === "string" ? item.blobUrl.trim() : ""))
    .filter((url): url is string => Boolean(url) && isTrustedBlobUrl(url));
}

// ─── Database ──────────────────────────────────────────────────
function getDbClient() {
  if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) return null;
  return createClient({ url: process.env.TURSO_DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN });
}

async function ensureSchema(db: ReturnType<typeof createClient> | null) {
  if (!db) return;
  if (!schemaReadyPromise) {
    schemaReadyPromise = (async () => {
      await db.execute(`CREATE TABLE IF NOT EXISTS app_sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        title TEXT NOT NULL,
        source_kind TEXT NOT NULL,
        source_payload_json TEXT NOT NULL,
        generations_json TEXT NOT NULL,
        test_submissions_json TEXT NOT NULL DEFAULT '[]',
        latest_mode TEXT NOT NULL,
        latest_difficulty TEXT NOT NULL
      )`);
      await db.execute(`CREATE INDEX IF NOT EXISTS idx_app_sessions_updated_at ON app_sessions(updated_at DESC)`);
      // Legacy DBs: add columns BEFORE any index on user_id (index on missing column breaks migration)
      try {
        await db.execute(`ALTER TABLE app_sessions ADD COLUMN user_id TEXT`);
      } catch {
        /* duplicate column */
      }
      try {
        await db.execute(
          `ALTER TABLE app_sessions ADD COLUMN test_submissions_json TEXT NOT NULL DEFAULT '[]'`
        );
      } catch {
        /* duplicate column */
      }
      await db.execute(`CREATE INDEX IF NOT EXISTS idx_app_sessions_user_id ON app_sessions(user_id)`);
      await db.execute(`CREATE TABLE IF NOT EXISTS guest_usage (
        ip TEXT PRIMARY KEY,
        count INTEGER NOT NULL DEFAULT 0,
        updated_at TEXT NOT NULL
      )`);
    })().catch((err) => {
      schemaReadyPromise = undefined;
      throw err;
    });
  }
  await schemaReadyPromise;
}

function summarizeTitle(sourceKind: string, sourcePayload: SourcePayload) {
  if (sourceKind === "text") {
    const text = String((sourcePayload as { text?: string }).text ?? "").trim().replace(/\s+/g, " ");
    return text.slice(0, 42) || "Notes session";
  }
  const names = Array.isArray((sourcePayload as { attachments?: AttachmentPayload[] }).attachments)
    ? (sourcePayload as { attachments: AttachmentPayload[] }).attachments.map((item) => item.name).filter(Boolean)
    : [];
  return names[0] || `${sourceKind === "pdf" ? "PDF" : sourceKind === "document" ? "Document" : "Photo"} session`;
}

function detectSourceKind(text: string, attachments: AttachmentPayload[]) {
  if (text) return "text";
  if (!attachments.length) return null;
  const hasPdf = attachments.some((item) => item?.type === "pdf");
  const hasDocument = attachments.some((item) => item?.type === "document");
  const hasImage = attachments.some((item) => item?.type === "image");
  if ([hasPdf, hasDocument, hasImage].filter(Boolean).length > 1) {
    throw new Error("Use only one source type per session.");
  }
  if (hasPdf) return "pdf";
  if (hasDocument) return "document";
  if (hasImage) return "image";
  throw new Error("Unsupported attachment type.");
}

// ─── User-scoped data functions ────────────────────────────────
async function listSessions(userId: string) {
  const db = getDbClient();
  if (!db) return [];
  await ensureSchema(db);
  const result = await db.execute({
    sql: `SELECT id, created_at, updated_at, title, source_kind, latest_mode, latest_difficulty FROM app_sessions WHERE user_id = ? ORDER BY updated_at DESC LIMIT 50`,
    args: [userId],
  });
  return result.rows.map((row) => ({
    id: String(row.id),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
    title: String(row.title),
    source_kind: String(row.source_kind),
    latest_mode: String(row.latest_mode),
    latest_difficulty: String(row.latest_difficulty),
  }));
}

async function getSessionById(id: string, userId: string) {
  const db = getDbClient();
  if (!db) return null;
  await ensureSchema(db);
  const result = await db.execute({
    sql: `SELECT * FROM app_sessions WHERE id = ? AND user_id = ? LIMIT 1`,
    args: [id, userId],
  });
  const row = result.rows[0];
  if (!row) return null;
  const generations = JSON.parse(String(row.generations_json ?? "[]"));
  const testSubmissions = JSON.parse(String(row.test_submissions_json ?? "[]"));
  return {
    id: String(row.id),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
    title: String(row.title),
    source_kind: String(row.source_kind),
    source_payload: JSON.parse(String(row.source_payload_json ?? "{}")),
    latest_mode: String(row.latest_mode),
    latest_difficulty: String(row.latest_difficulty),
    generations,
    test_submissions: testSubmissions,
    latest_generation: generations[generations.length - 1] ?? null,
  };
}

async function deleteSession(id: string, userId: string) {
  const db = getDbClient();
  if (!db) return;
  await ensureSchema(db);
  const existing = await getSessionById(id, userId);
  const blobUrls = existing ? getSessionImageBlobUrls(existing.source_payload as SourcePayload) : [];

  if (blobUrls.length) {
    try {
      await del(blobUrls);
    } catch (error) {
      console.error("Blob cleanup failed during session delete:", error);
    }
  }

  await db.execute({ sql: `DELETE FROM app_sessions WHERE id = ? AND user_id = ?`, args: [id, userId] });
}

async function saveGeneration({
  userId,
  sessionId,
  sourceKind,
  sourcePayload,
  mode,
  difficulty,
  modelUsed,
  questions,
}: {
  userId: string;
  sessionId: string | null;
  sourceKind: string;
  sourcePayload: SourcePayload;
  mode: string;
  difficulty: string;
  modelUsed: string;
  questions: unknown;
}) {
  const db = getDbClient();
  if (!db) return { sessionId: sessionId ?? null, stored: false };
  await ensureSchema(db);

  const now = new Date().toISOString();
  const generation = {
    id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    created_at: now,
    mode,
    difficulty,
    model_used: modelUsed,
    questions,
  };

  if (sessionId) {
    const existing = await getSessionById(sessionId, userId);
    if (!existing) throw new Error("Session not found.");
    const generations = [...existing.generations, generation];
    await db.execute({
      sql: `UPDATE app_sessions SET updated_at = ?, title = ?, source_payload_json = ?, generations_json = ?, latest_mode = ?, latest_difficulty = ? WHERE id = ? AND user_id = ?`,
      args: [now, summarizeTitle(sourceKind, sourcePayload), JSON.stringify(sourcePayload), JSON.stringify(generations), mode, difficulty, sessionId, userId],
    });
    return { sessionId, stored: true };
  }

  const id = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  await db.execute({
    sql: `INSERT INTO app_sessions (id, user_id, created_at, updated_at, title, source_kind, source_payload_json, generations_json, latest_mode, latest_difficulty) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [id, userId, now, now, summarizeTitle(sourceKind, sourcePayload), sourceKind, JSON.stringify(sourcePayload), JSON.stringify([generation]), mode, difficulty],
  });
  return { sessionId: id, stored: true };
}

async function saveTestSubmission({
  userId,
  sessionId,
  submission,
}: {
  userId: string;
  sessionId: string;
  submission: Record<string, unknown>;
}) {
  const db = getDbClient();
  if (!db) return;
  await ensureSchema(db);
  const existing = await getSessionById(sessionId, userId);
  if (!existing) throw new Error("Session not found.");
  const submissions = [...(existing.test_submissions ?? []), submission];
  await db.execute({
    sql: `UPDATE app_sessions SET updated_at = ?, test_submissions_json = ? WHERE id = ? AND user_id = ?`,
    args: [new Date().toISOString(), JSON.stringify(submissions), sessionId, userId],
  });
}

// ─── AI calls ──────────────────────────────────────────────────
async function callOpenAiCompatibleChat({
  apiKey,
  baseUrl,
  model,
  messages,
  maxTokens = 2048,
}: {
  apiKey: string;
  baseUrl: string;
  model: string;
  messages: unknown[];
  maxTokens?: number;
}) {
  const upstream = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model, messages, max_tokens: maxTokens, temperature: 0.6, top_p: 0.92 }),
  });
  const payload = await upstream.json().catch(() => ({}));
  if (!upstream.ok) throw new Error((payload as { error?: { message?: string }; detail?: string })?.error?.message || (payload as { detail?: string })?.detail || `API error (${upstream.status})`);
  const raw = (payload as { choices?: Array<{ message?: { content?: string } }> })?.choices?.[0]?.message?.content;
  if (typeof raw !== "string" || !raw.trim()) throw new Error("Model returned an empty response");
  return raw;
}

async function callDeepInfraJson({ apiKey, model, messages, maxTokens = 2048 }: { apiKey: string; model: string; messages: unknown[]; maxTokens?: number }) {
  return parseModelJson(await callOpenAiCompatibleChat({
    apiKey,
    baseUrl: DEEPINFRA_BASE_URL,
    model,
    messages,
    maxTokens,
  }));
}

async function generateQuestions({
  apiKey,
  sourceKind,
  sourcePayload,
  mode,
  difficulty,
}: {
  apiKey: string;
  sourceKind: string;
  sourcePayload: SourcePayload;
  mode: string;
  difficulty: string;
}) {
  if (sourceKind === "text" || sourceKind === "pdf" || sourceKind === "document") {
    const rawText = String((sourcePayload as { text?: string }).text ?? "").trim();
    const text = sourceKind === "pdf" || sourceKind === "document" ? trimPdfText(rawText) : rawText;
    if (text.length < 10) throw new Error("Text too short (min 10 characters)");
    if (sourceKind === "text" && text.length > MAX_TEXT_SOURCE_CHARS) {
      throw new Error("Text too long (max 12000 characters)");
    }
    const questions = normalizeQuestionSet(await callDeepInfraJson({
      apiKey,
      model: PRIMARY_MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildTextPrompt(mode, difficulty, buildDocumentSourceLabel(sourceKind), text) },
      ],
    }));
    return { questions, modelUsed: PRIMARY_MODEL };
  }

  const attachments = Array.isArray((sourcePayload as { attachments?: AttachmentPayload[] }).attachments)
    ? (sourcePayload as { attachments: AttachmentPayload[] }).attachments
    : [];
  const imageParts = attachments
    .slice(0, 4)
    .map((item) => getImageSourceUrl(item))
    .filter(Boolean)
    .map((url) => ({ type: "image_url", image_url: { url } }));
  if (!imageParts.length) throw new Error("No usable images were found.");
  const questions = normalizeQuestionSet(await callDeepInfraJson({
    apiKey,
    model: PRIMARY_MODEL,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: [{ type: "text", text: buildVisionPrompt(mode, difficulty, attachments) }, ...imageParts] },
    ],
    maxTokens: 2500,
  }));
  return { questions, modelUsed: PRIMARY_MODEL };
}

function flattenQuestions(questionSet: Record<string, unknown>) {
  const result: Array<Record<string, unknown>> = [];
  for (const item of (Array.isArray(questionSet.multiple_choice) ? questionSet.multiple_choice : [])) {
    result.push({ kind: "multiple-choice", ...item as object });
  }
  for (const item of (Array.isArray(questionSet.true_false) ? questionSet.true_false : [])) {
    result.push({ kind: "true-false", ...item as object });
  }
  for (const item of (Array.isArray(questionSet.short_answer) ? questionSet.short_answer : [])) {
    result.push({ kind: "short-answer", ...item as object });
  }
  return result;
}

function samplePreviousQuestions(sessions: Array<Record<string, unknown>>, limit = 6) {
  const bag: Array<Record<string, unknown>> = [];
  for (const session of sessions) {
    const generations = Array.isArray(session.generations) ? session.generations : [];
    for (const generation of generations.slice(-2)) {
      bag.push(...flattenQuestions((generation as { questions?: Record<string, unknown> }).questions ?? {}));
    }
  }
  return bag.slice(0, limit);
}

async function generateTest({
  apiKey,
  session,
  includePrevious,
  userId,
}: {
  apiKey: string;
  session: Awaited<ReturnType<typeof getSessionById>>;
  includePrevious: boolean;
  userId: string;
}) {
  if (!session) throw new Error("Session not found.");
  const sourceKind = session.source_kind;
  const sourcePayload = session.source_payload as SourcePayload;
  let contextText = "";

  if (sourceKind === "text" || sourceKind === "pdf" || sourceKind === "document") {
    contextText = String((sourcePayload as { text?: string }).text ?? "").trim();
  } else {
    contextText = "Generate a test from the uploaded images in this current session.";
  }

  let previousContext = "";
  if (includePrevious) {
    const sessions = await listSessions(userId);
    const others = [];
    for (const item of sessions) {
      if (item.id === session.id) continue;
      const full = await getSessionById(item.id, userId);
      if (full) others.push(full);
      if (others.length >= 4) break;
    }
    const sampled = samplePreviousQuestions(others);
    if (sampled.length) {
      previousContext = `\nAlso include a mix of concepts inspired by these previous study questions:\n${JSON.stringify(sampled)}`;
    }
  }

  const prompt = `Create a closed-book test for this student.
Generate:
- 6 multiple-choice
- 4 true/false
- 3 short-answer

Use the current session as the main source.${includePrevious ? " Blend in a few ideas from previous sessions too." : ""}

Current session context:
${contextText}${previousContext}`;

  const questions = sourceKind === "image"
    ? normalizeQuestionSet(await callDeepInfraJson({
        apiKey,
        model: PRIMARY_MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              ...((sourcePayload as { attachments?: AttachmentPayload[] }).attachments ?? [])
                .slice(0, 4)
                .map((item) => getImageSourceUrl(item))
                .filter(Boolean)
                .map((url) => ({ type: "image_url", image_url: { url } })),
            ],
          },
        ],
        maxTokens: 2500,
      }))
    : normalizeQuestionSet(await callDeepInfraJson({
        apiKey,
        model: PRIMARY_MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: prompt },
        ],
        maxTokens: 2200,
      }));

  return questions;
}

async function evaluateShortAnswers({
  apiKey,
  questions,
  answers,
}: {
  apiKey: string;
  questions: Array<{ question?: string; answer?: string }>;
  answers: Record<string, string>;
}) {
  if (!questions.length) return { score: 0, total: 0, evaluations: [] as Array<Record<string, unknown>> };
  const prompt = `Evaluate each student answer against the expected answer.
Return JSON only in this format:
{"evaluations":[{"index":0,"correct":true,"feedback":"..."}]}

Questions:
${JSON.stringify(questions.map((q, i) => ({ index: i, question: q.question, expected_answer: q.answer, student_answer: answers[`sa-${i}`] ?? "" })))}`;

  const result = await callDeepInfraJson({
    apiKey,
    model: PRIMARY_MODEL,
    messages: [
      { role: "system", content: "You are a strict but fair grading assistant. Return JSON only." },
      { role: "user", content: prompt },
    ],
    maxTokens: 1200,
  }) as { evaluations?: Array<{ index?: number; correct?: boolean; feedback?: string }> };

  const evaluations = Array.isArray(result.evaluations) ? result.evaluations : [];
  return {
    score: evaluations.filter((item) => item.correct).length,
    total: questions.length,
    evaluations,
  };
}

// ─── Study insights (for Aawax chat) ───────────────────────────
type WrongAnswer = { type: string; question: string; correctAnswer: string };

function collectWrongAnswers(submission: Record<string, unknown>): WrongAnswer[] {
  const wrong: WrongAnswer[] = [];
  const questions = (submission.questions ?? {}) as Record<string, unknown>;
  const answers = (submission.answers ?? {}) as Record<string, string>;
  const evals = Array.isArray(submission.shortAnswerEvaluations)
    ? (submission.shortAnswerEvaluations as Array<{ index?: number; correct?: boolean }>)
    : [];

  const mcq = Array.isArray(questions.multiple_choice) ? questions.multiple_choice : [];
  mcq.forEach((q: Record<string, unknown>, i: number) => {
    const expected = String(q.answer ?? "").trim().toUpperCase().match(/[A-D]/)?.[0] || "";
    if ((answers[`mcq-${i}`] ?? "") !== expected) {
      wrong.push({ type: "multiple-choice", question: String(q.question ?? ""), correctAnswer: String(q.answer ?? "") });
    }
  });
  const tf = Array.isArray(questions.true_false) ? questions.true_false : [];
  tf.forEach((q: Record<string, unknown>, i: number) => {
    const expected = typeof q.answer === "boolean" ? (q.answer ? "True" : "False") : String(q.answer);
    if ((answers[`tf-${i}`] ?? "") !== expected) {
      wrong.push({ type: "true-false", question: String(q.statement ?? ""), correctAnswer: expected });
    }
  });
  const sa = Array.isArray(questions.short_answer) ? questions.short_answer : [];
  sa.forEach((q: Record<string, unknown>, i: number) => {
    const evaluation = evals.find((e) => e.index === i);
    if (evaluation && evaluation.correct === false) {
      wrong.push({ type: "short-answer", question: String(q.question ?? ""), correctAnswer: String(q.answer ?? "") });
    }
  });
  return wrong;
}

async function computeStudyInsights(userId: string) {
  const sessions = await listSessions(userId);
  const scores: Array<{ pct: number; title: string; at: string }> = [];
  const wrongByType: Record<string, number> = { "multiple-choice": 0, "true-false": 0, "short-answer": 0 };
  const wrongExamples: WrongAnswer[] = [];

  for (const item of sessions) {
    const full = await getSessionById(item.id, userId);
    if (!full) continue;
    const subs = Array.isArray(full.test_submissions) ? full.test_submissions : [];
    for (const sub of subs as Array<Record<string, unknown>>) {
      const total = Number(sub.total ?? 0);
      const score = Number(sub.score ?? 0);
      if (total > 0) {
        scores.push({ pct: Math.round((score / total) * 100), title: full.title, at: String(sub.created_at ?? "") });
      }
      for (const w of collectWrongAnswers(sub)) {
        wrongByType[w.type] = (wrongByType[w.type] ?? 0) + 1;
        if (wrongExamples.length < 8 && w.question) wrongExamples.push(w);
      }
    }
  }

  scores.sort((a, b) => +new Date(a.at) - +new Date(b.at));
  const pcts = scores.map((s) => s.pct);
  const avg = pcts.length ? Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length) : 0;
  const best = pcts.length ? Math.max(...pcts) : 0;
  const recent = pcts.slice(-5);
  let trend = "not enough data";
  if (recent.length >= 2) {
    const diff = recent[recent.length - 1] - recent[0];
    trend = diff > 5 ? "improving" : diff < -5 ? "slipping" : "steady";
  }
  return { totalTests: pcts.length, avg, best, recent, trend, wrongByType, wrongExamples };
}

function buildInsightsContext(insights: Awaited<ReturnType<typeof computeStudyInsights>>) {
  if (!insights.totalTests) {
    return "Student data: The student has not completed any tests yet. Encourage them gently to take one.";
  }
  const lines = [
    `Student data (use this to answer questions about their progress):`,
    `- Tests taken: ${insights.totalTests}`,
    `- Average score: ${insights.avg}%`,
    `- Best score: ${insights.best}%`,
    `- Recent scores (oldest to newest): ${insights.recent.join("%, ")}%`,
    `- Score trend: ${insights.trend}`,
    `- Wrong answers by type: multiple-choice ${insights.wrongByType["multiple-choice"]}, true/false ${insights.wrongByType["true-false"]}, short-answer ${insights.wrongByType["short-answer"]}`,
    `Note: short-answer and difficult questions usually test deep conceptual understanding. If the student misses many of those, suggest they focus on understanding core concepts rather than memorising.`,
  ];
  if (insights.wrongExamples.length) {
    lines.push(`- Examples of questions they got wrong:`);
    for (const w of insights.wrongExamples.slice(0, 5)) {
      lines.push(`  (${w.type}) ${w.question.slice(0, 140)}`);
    }
  }
  return lines.join("\n");
}

type ChatTurn = { role: "user" | "assistant"; content: string };

async function chatWithAawax({
  apiKey,
  userId,
  messages,
  images,
}: {
  apiKey: string;
  userId: string;
  messages: ChatTurn[];
  images: string[];
}) {
  const insights = await computeStudyInsights(userId);
  const system = `${AAWAX_SYSTEM_PROMPT}\n\n${buildInsightsContext(insights)}`;

  const trimmed = messages.slice(-10);
  const finalMessages: unknown[] = [{ role: "system", content: system }];
  trimmed.forEach((m, i) => {
    const isLastUser = i === trimmed.length - 1 && m.role === "user";
    if (isLastUser && images.length) {
      finalMessages.push({
        role: "user",
        content: [
          { type: "text", text: m.content },
          ...images.slice(0, 3).map((url) => ({ type: "image_url", image_url: { url } })),
        ],
      });
    } else {
      finalMessages.push({ role: m.role, content: m.content });
    }
  });

  const reply = await callOpenAiCompatibleChat({
    apiKey,
    baseUrl: DEEPINFRA_BASE_URL,
    model: PRIMARY_MODEL,
    messages: finalMessages,
    maxTokens: 900,
  });
  return reply.trim();
}

// ─── Route handlers ────────────────────────────────────────────
export async function OPTIONS() {
  return makeResponse(200, {});
}

export async function GET(request: Request) {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) return makeResponse(200, { sessions: [] });

    const url = new URL(request.url);
    const sessionId = url.searchParams.get("sessionId");
    if (sessionId) {
      const session = await getSessionById(sessionId, userId);
      if (!session) return makeResponse(404, { detail: "Session not found" });
      return makeResponse(200, { session });
    }
    return makeResponse(200, { sessions: await listSessions(userId) });
  } catch (error) {
    return makeResponse(500, {
      detail: error instanceof Error ? error.message : "Server error",
      stack: error instanceof Error ? error.stack : undefined,
    });
  }
}

export async function DELETE(request: Request) {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) return makeResponse(401, { detail: "Sign in to manage sessions." });

    const url = new URL(request.url);
    const sessionId = url.searchParams.get("sessionId");
    if (!sessionId) return makeResponse(400, { detail: "sessionId is required" });
    await deleteSession(sessionId, userId);
    return makeResponse(200, { ok: true });
  } catch (error) {
    return makeResponse(500, {
      detail: error instanceof Error ? error.message : "Server error",
      stack: error instanceof Error ? error.stack : undefined,
    });
  }
}

export async function POST(request: Request) {
  let heldConcurrencySlot = false;
  try {
    const body = await request.json().catch(() => null);
    if (!body) return makeResponse(400, { detail: "Invalid JSON body" });

    const action = String((body as { action?: string }).action ?? "generate");
    const mode = String((body as { mode?: string }).mode ?? "mix");
    const difficulty = String((body as { difficulty?: string }).difficulty ?? "medium");
    const text = String((body as { text?: string }).text ?? "").trim();
    const attachments = Array.isArray((body as { attachments?: AttachmentPayload[] }).attachments) ? (body as { attachments: AttachmentPayload[] }).attachments : [];
    const sessionId = (body as { sessionId?: string }).sessionId ? String((body as { sessionId?: string }).sessionId) : null;

    const userId = await getAuthenticatedUserId();
    const ip = getClientIp(request);
    const isGuest = !userId;
    // Guests are tracked (and persisted) under a synthetic identity keyed by IP.
    const identity = userId ?? `guest:${ip}`;

    // 1) Concurrency cap: reject extra load instead of crashing under it.
    if (HEAVY_ACTIONS.has(action)) {
      if (inFlightAI >= MAX_CONCURRENT_AI) {
        return makeResponse(429, {
          detail: "Study Buddy is handling a lot of requests right now. Please try again in a few seconds.",
        });
      }
      inFlightAI += 1;
      heldConcurrencySlot = true;
    }

    // 2) Per-account rate limit.
    if (userId && HEAVY_ACTIONS.has(action) && !checkAccountRate(userId)) {
      return makeResponse(429, {
        detail: `You're going a bit fast (limit ${ACCOUNT_RATE_LIMIT} requests per minute). Please wait a moment.`,
      });
    }

    // 3) Guest free-use cap (3 total without an account).
    if (isGuest && GUEST_COUNTED_ACTIONS.has(action)) {
      const used = await getGuestUsage(ip);
      if (used >= GUEST_USE_LIMIT) {
        return makeResponse(429, {
          detail: `You've used all ${GUEST_USE_LIMIT} free guest tries. Sign in to keep generating questions and tests.`,
        });
      }
    }

    if (action === "generate_test") {
      if (!sessionId) return makeResponse(422, { detail: "sessionId is required for tests." });
      const session = await getSessionById(sessionId, identity);
      if (!session) return makeResponse(404, { detail: "Session not found" });
      if (!process.env.DEEPINFRA_API_KEY) {
        return makeResponse(500, { detail: "DEEPINFRA_API_KEY not configured" });
      }
      const testQuestions = await generateTest({
        apiKey: process.env.DEEPINFRA_API_KEY,
        session,
        includePrevious: Boolean((body as { includePrevious?: boolean }).includePrevious),
        userId: identity,
      });
      if (isGuest) await incrGuestUsage(ip);
      return makeResponse(200, { questions: testQuestions });
    }

    if (action === "chat") {
      if (!process.env.DEEPINFRA_API_KEY) return makeResponse(500, { detail: "DEEPINFRA_API_KEY not configured" });
      const rawMessages = Array.isArray((body as { messages?: unknown[] }).messages)
        ? (body as { messages: unknown[] }).messages
        : [];
      const messages: ChatTurn[] = rawMessages
        .map((m) => m as { role?: string; content?: string })
        .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
        .map((m) => ({ role: m.role as "user" | "assistant", content: String(m.content) }));
      if (!messages.length) return makeResponse(422, { detail: "A message is required." });
      const images = Array.isArray((body as { images?: unknown[] }).images)
        ? (body as { images: unknown[] }).images.filter((u): u is string => typeof u === "string").slice(0, 3)
        : [];
      const reply = await chatWithAawax({
        apiKey: process.env.DEEPINFRA_API_KEY,
        userId: identity,
        messages,
        images,
      });
      if (isGuest) await incrGuestUsage(ip);
      return makeResponse(200, { reply });
    }

    if (action === "submit_test") {
      if (!sessionId) return makeResponse(422, { detail: "sessionId is required for test submission." });
      const submission = (body as { submission?: Record<string, unknown> }).submission;
      if (!submission) return makeResponse(422, { detail: "submission is required." });
      await saveTestSubmission({ userId: identity, sessionId, submission });
      return makeResponse(200, { ok: true });
    }

    if (action === "grade_short_answers") {
      if (!process.env.DEEPINFRA_API_KEY) return makeResponse(500, { detail: "DEEPINFRA_API_KEY not configured" });
      const questions = Array.isArray((body as { questions?: Array<{ question?: string; answer?: string }> }).questions) ? (body as { questions: Array<{ question?: string; answer?: string }> }).questions : [];
      const answers = typeof (body as { answers?: Record<string, string> }).answers === "object" && (body as { answers?: Record<string, string> }).answers !== null ? (body as { answers: Record<string, string> }).answers : {};
      return makeResponse(200, await evaluateShortAnswers({
        apiKey: process.env.DEEPINFRA_API_KEY,
        questions,
        answers,
      }));
    }

    if (!ALLOWED_MODES.has(mode)) return makeResponse(422, { detail: "Invalid question format." });
    if (!ALLOWED_DIFFICULTIES.has(difficulty)) return makeResponse(422, { detail: "Invalid difficulty." });

    let sourceKind: string | null;
    let sourcePayload: SourcePayload;

    if (sessionId) {
      const existing = await getSessionById(sessionId, identity);
      if (!existing) return makeResponse(404, { detail: "Session not found" });
      sourceKind = existing.source_kind;
      sourcePayload = existing.source_payload as SourcePayload;
    } else {
      sourceKind = detectSourceKind(text, attachments);
      if (!sourceKind) return makeResponse(422, { detail: "Please add notes, a PDF, a DOCX, or one or more photos." });
      // Guests can only use the text path (file uploads require an account).
      if (isGuest && sourceKind !== "text") {
        return makeResponse(401, { detail: "Sign in to generate from PDFs, documents, or photos. Pasted notes work without an account." });
      }
      const imageCount = attachments.filter((a) => a?.type === "image").length;
      if (sourceKind === "image" && imageCount > 4) {
        return makeResponse(422, { detail: "Maximum 4 images per request." });
      }
      if (sourceKind === "pdf" && attachments.length !== 1) return makeResponse(422, { detail: "Only one PDF can be used in a session." });
      if (sourceKind === "document" && attachments.length !== 1) return makeResponse(422, { detail: "Only one document can be used in a session." });
      sourcePayload = sourceKind === "text"
        ? { text }
        : sourceKind === "pdf" || sourceKind === "document"
          ? { text: String(attachments[0]?.extractedText ?? ""), attachments: attachments.map((item) => ({ name: item.name, type: item.type })) }
          : {
              attachments: attachments.map((item) => ({
                name: item.name,
                type: item.type,
                dataUrl: item.dataUrl,
                blobUrl: item.blobUrl,
                mimeType: item.mimeType,
                origin: item.origin,
              })),
            };
    }

    if (!process.env.DEEPINFRA_API_KEY) {
      return makeResponse(500, { detail: "DEEPINFRA_API_KEY not configured" });
    }

    const { questions, modelUsed } = await generateQuestions({
      apiKey: process.env.DEEPINFRA_API_KEY,
      sourceKind,
      sourcePayload,
      mode,
      difficulty,
    });

    const saved = await saveGeneration({ userId: identity, sessionId, sourceKind, sourcePayload, mode, difficulty, modelUsed, questions });
    if (isGuest) await incrGuestUsage(ip);
    return makeResponse(200, { questions, sessionId: saved.sessionId, sourceKind, latestMode: mode, latestDifficulty: difficulty });
  } catch (error) {
    // Surface the raw error while edge testing so bugs are easy to track down.
    return makeResponse(500, {
      detail: error instanceof Error ? error.message : "Server error",
      stack: error instanceof Error ? error.stack : undefined,
    });
  } finally {
    if (heldConcurrencySlot) inFlightAI -= 1;
  }
}
