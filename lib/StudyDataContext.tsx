"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useAuth } from "./useAuth";

// ─── Types ─────────────────────────────────────────────────────────────────────

export type StudySession = {
  id: string;
  title: string;
  updated_at: string;
  latest_mode: string;
  latest_difficulty: string;
  source_kind: string;
  questionCount?: number;
};

export type StudyTest = {
  id: string;
  created_at: string;
  score: number;
  total: number;
  sessionId?: string;
  sessionTitle?: string;
  questions?: unknown;
  answers?: Record<string, string>;
  shortAnswerEvaluations?: { index?: number; correct?: boolean; feedback?: string }[];
};

type ContextValue = {
  sessions: StudySession[];
  tests: StudyTest[];
  loading: boolean;
  user: ReturnType<typeof useAuth>["user"];
  refresh: () => Promise<void>;
};

// ─── Module-level cache ────────────────────────────────────────────────────────
// Lives outside React — survives tab navigation (page component unmounts but the
// module does not). Re-hydrates useState on remount so pages feel instant.

const _cache: {
  userId: string | null;
  sessions: StudySession[];
  tests: StudyTest[];
  fetchedAt: number;
} = { userId: null, sessions: [], tests: [], fetchedAt: 0 };

const STALE_MS = 60_000; // background-refresh after 60 s; serve cache instantly

// ─── Context ───────────────────────────────────────────────────────────────────

const StudyDataContext = createContext<ContextValue | null>(null);

export function StudyDataProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();

  // Seed state from cache on first render so there is no loading flash on re-visit
  const [sessions, setSessions] = useState<StudySession[]>(() =>
    _cache.userId === (user?.id ?? null) && _cache.fetchedAt > 0 ? _cache.sessions : []
  );
  const [tests, setTests] = useState<StudyTest[]>(() =>
    _cache.userId === (user?.id ?? null) && _cache.fetchedAt > 0 ? _cache.tests : []
  );
  const [loading, setLoading] = useState<boolean>(
    () => !(_cache.userId === (user?.id ?? null) && _cache.fetchedAt > 0)
  );

  const inflight = useRef(false);

  const load = useCallback(
    async (force = false) => {
      if (!user) {
        setSessions([]);
        setTests([]);
        setLoading(false);
        _cache.userId = null;
        _cache.sessions = [];
        _cache.tests = [];
        _cache.fetchedAt = 0;
        return;
      }

      const now = Date.now();
      const cacheHit =
        _cache.userId === user.id && _cache.fetchedAt > 0 && now - _cache.fetchedAt < STALE_MS;

      if (!force && cacheHit) {
        setSessions(_cache.sessions);
        setTests(_cache.tests);
        setLoading(false);
        return;
      }

      // Prevent concurrent fetches
      if (inflight.current) return;
      inflight.current = true;

      // If we already have cached data, show it immediately (no spinner)
      // and silently refresh in the background
      if (_cache.userId === user.id && _cache.fetchedAt > 0) {
        setSessions(_cache.sessions);
        setTests(_cache.tests);
        setLoading(false);
      } else {
        setLoading(true);
      }

      try {
        const res = await fetch("/api/generate");
        const data = await res.json().catch(() => ({}));
        const list: StudySession[] = Array.isArray(data.sessions) ? data.sessions : [];
        setSessions(list);

        // ── Parallel fetch: all sessions at once instead of one-by-one ──────────
        // Sequential was the cause of the 5-second delay (N × network RTT).
        const perSession = await Promise.all(
          list.map(async (session) => {
            try {
              const r = await fetch(`/api/generate?sessionId=${encodeURIComponent(session.id)}`);
              const d = await r.json().catch(() => ({}));
              if (d.session && Array.isArray(d.session.test_submissions)) {
                return d.session.test_submissions.map((t: unknown) => ({
                  ...(t as object),
                  sessionId: session.id,
                  sessionTitle: session.title,
                })) as StudyTest[];
              }
            } catch { /* skip */ }
            return [] as StudyTest[];
          })
        );

        const allTests = perSession
          .flat()
          .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));

        setTests(allTests);

        // Write-through cache
        _cache.userId = user.id;
        _cache.sessions = list;
        _cache.tests = allTests;
        _cache.fetchedAt = Date.now();
      } catch {
        // On error, keep whatever we already have in state
        if (!_cache.fetchedAt) {
          setSessions([]);
          setTests([]);
        }
      } finally {
        setLoading(false);
        inflight.current = false;
      }
    },
    [user]
  );

  useEffect(() => {
    if (authLoading) return;

    const now = Date.now();
    const cacheValid = _cache.userId === (user?.id ?? null) && _cache.fetchedAt > 0;

    if (cacheValid) {
      // Serve from cache instantly
      setSessions(_cache.sessions);
      setTests(_cache.tests);
      setLoading(false);

      // Background-refresh if stale
      if (now - _cache.fetchedAt > STALE_MS) {
        void load(true);
      }
    } else {
      void load(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user?.id]);

  return (
    <StudyDataContext.Provider
      value={{
        sessions,
        tests,
        loading: loading || authLoading,
        user,
        refresh: () => load(true),
      }}
    >
      {children}
    </StudyDataContext.Provider>
  );
}

export function useStudyData(): ContextValue {
  const ctx = useContext(StudyDataContext);
  if (!ctx) throw new Error("useStudyData must be used inside <StudyDataProvider>");
  return ctx;
}
