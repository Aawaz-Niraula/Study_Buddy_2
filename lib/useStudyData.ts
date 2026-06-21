"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "./useAuth";

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

/** Loads the signed-in user's sessions and all their test submissions. */
export function useStudyData() {
  const { user, loading: authLoading } = useAuth();
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [tests, setTests] = useState<StudyTest[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) {
      setSessions([]);
      setTests([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/generate");
      const data = await res.json().catch(() => ({}));
      const list: StudySession[] = Array.isArray(data.sessions) ? data.sessions : [];
      setSessions(list);

      const allTests: StudyTest[] = [];
      for (const session of list) {
        try {
          const r = await fetch(`/api/generate?sessionId=${encodeURIComponent(session.id)}`);
          const d = await r.json().catch(() => ({}));
          if (d.session && Array.isArray(d.session.test_submissions)) {
            for (const t of d.session.test_submissions) {
              allTests.push({ ...t, sessionId: session.id, sessionTitle: session.title });
            }
          }
        } catch {
          /* skip session that fails */
        }
      }
      allTests.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
      setTests(allTests);
    } catch {
      setSessions([]);
      setTests([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading) void load();
  }, [authLoading, load]);

  return { sessions, tests, loading: loading || authLoading, user, refresh: load };
}
