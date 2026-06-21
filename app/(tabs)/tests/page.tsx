"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import { PencilLine, ChevronRight } from "lucide-react";
import { PageTitle } from "@/components/layout/PageTitle";
import { TestHistoryList } from "@/components/TestHistoryList";
import { TestReviewScreen } from "@/components/TestReviewScreen";
import { Portal } from "@/components/Portal";
import { Aawax } from "@/components/mascot/Aawax";
import { useMascot } from "@/lib/mascot/MascotContext";
import { useStudyData, type StudyTest } from "@/lib/useStudyData";
import { buildReviewRows } from "@/lib/reviewQuestions";

export default function TestsPage() {
  const router = useRouter();
  const { sessions, tests, loading, user } = useStudyData();
  const { design, color, openChat } = useMascot();
  const [reviewing, setReviewing] = useState<StudyTest | null>(null);

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

  return (
    <>
      <PageTitle
        eyebrow="Tests"
        title="Quiz yourself"
        subtitle="Start a fresh test from any session, or review how past attempts went."
      />

      {/* Start a new test */}
      <h2 className="mb-3 text-[11px] font-bold uppercase tracking-[0.22em] text-white/40">Start a test</h2>
      {!loading && (!user || sessions.length === 0) ? (
        <div className="app-card flex items-center gap-3 text-sm text-white/55">
          <PencilLine className="h-5 w-5 shrink-0" style={{ color: "var(--accent-soft)" }} />
          {user ? "Generate questions first, then come back to test yourself." : "Sign in and generate questions to take tests."}
        </div>
      ) : (
        <div className="space-y-2">
          {sessions.slice(0, 6).map((s, i) => (
            <motion.button
              key={s.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => router.push(`/?session=${encodeURIComponent(s.id)}`)}
              className="flex w-full items-center justify-between rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4 text-left transition-colors hover:bg-white/[0.06] cursor-pointer"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-white">{s.title}</p>
                <p className="mt-0.5 text-xs capitalize text-white/45">
                  {s.latest_difficulty} · {s.latest_mode}
                </p>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-white/30" />
            </motion.button>
          ))}
        </div>
      )}

      {/* Past attempts */}
      <h2 className="mb-3 mt-8 text-[11px] font-bold uppercase tracking-[0.22em] text-white/40">
        Your attempts
      </h2>
      {!loading && tests.length === 0 ? (
        <div className="flex flex-col items-center py-6 text-center">
          <Aawax design={design} color={color} mood="idle" size={96} glow float />
          <p className="mt-2 text-sm text-white/50">No tests taken yet.</p>
        </div>
      ) : (
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
      )}
    </>
  );
}
