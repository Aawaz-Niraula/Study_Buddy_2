"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { PageTitle } from "@/components/layout/PageTitle";
import { SessionHistoryList } from "@/components/SessionHistoryList";
import { TestHistoryList } from "@/components/TestHistoryList";
import { TestReviewScreen } from "@/components/TestReviewScreen";
import { Portal } from "@/components/Portal";
import { Aawax } from "@/components/mascot/Aawax";
import { useMascot } from "@/lib/mascot/MascotContext";
import { useStudyData, type StudyTest } from "@/lib/useStudyData";
import { buildReviewRows } from "@/lib/reviewQuestions";

export default function HistoryPage() {
  const router = useRouter();
  const { sessions, tests, loading, user, refresh } = useStudyData();
  const { design, color, openChat } = useMascot();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [reviewing, setReviewing] = useState<StudyTest | null>(null);

  const deleteSession = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/generate?sessionId=${encodeURIComponent(id)}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Session deleted.");
        await refresh();
      } else toast.error("Could not delete session.");
    } catch {
      toast.error("Could not delete session.");
    } finally {
      setDeletingId(null);
    }
  };

  if (reviewing) {
    return (
      <Portal>
        <TestReviewScreen
          questions={buildReviewRows(
            reviewing.questions as Parameters<typeof buildReviewRows>[0],
            reviewing.answers,
            reviewing.shortAnswerEvaluations
          )}
          score={reviewing.score}
          total={reviewing.total}
          onClose={() => setReviewing(null)}
          onAskAawax={(question) => openChat(`I got this question wrong:\n\n"${question}"\n\nElaborate, Aawax.`)}
        />
      </Portal>
    );
  }

  const empty = !loading && (!user || (sessions.length === 0 && tests.length === 0));

  return (
    <>
      <PageTitle
        eyebrow="History"
        title="Your study history"
        subtitle="Reopen past note sets, or revisit a test and ask Aawax about anything you missed."
      />

      {empty ? (
        <div className="mt-10 flex flex-col items-center text-center">
          <Aawax design={design} color={color} mood="idle" size={120} glow float />
          <p className="mt-3 font-serif text-lg text-white">
            {user ? "Nothing here yet" : "Sign in to see history"}
          </p>
          <p className="mt-1 max-w-xs text-sm text-white/50">
            {user
              ? "Generate your first question set and it will show up here."
              : "Your saved sessions and tests appear here once you're signed in."}
          </p>
          <button onClick={() => router.push("/")} className="btn-primary mt-6 max-w-xs">
            Go to Generate
          </button>
        </div>
      ) : (
        <>
          <h2 className="mb-3 text-[11px] font-bold uppercase tracking-[0.22em] text-white/40">Sessions</h2>
          <SessionHistoryList
            sessions={sessions}
            currentSessionId={null}
            currentSessionTitle=""
            currentGenerations={[]}
            activeGenerationId={null}
            onSelectSession={(id) => router.push(`/?session=${encodeURIComponent(id)}`)}
            onSelectGeneration={() => {}}
            onDeleteSession={deleteSession}
            loading={loading}
            deletingSessionId={deletingId}
          />

          {tests.length > 0 && (
            <>
              <h2 className="mb-3 mt-8 text-[11px] font-bold uppercase tracking-[0.22em] text-white/40">
                Past tests
              </h2>
              <p className="mb-3 text-xs text-white/45">
                Tap a test to review it. On any wrong answer you can ask Aawax to explain.
              </p>
              <TestHistoryList
                tests={tests.map((t) => ({
                  id: t.id,
                  created_at: t.created_at,
                  score: t.score,
                  total: t.total,
                  sessionTitle: t.sessionTitle,
                }))}
                onSelectTest={(id) => {
                  const t = tests.find((x) => x.id === id);
                  if (t) setReviewing(t);
                }}
                loading={loading}
              />
            </>
          )}
        </>
      )}
    </>
  );
}
