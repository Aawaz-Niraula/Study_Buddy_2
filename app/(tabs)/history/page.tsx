"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { PageTitle } from "@/components/layout/PageTitle";
import { SessionHistoryList } from "@/components/SessionHistoryList";
import { Aawax } from "@/components/mascot/Aawax";
import { useMascot } from "@/lib/mascot/MascotContext";
import { useStudyData } from "@/lib/useStudyData";

export default function HistoryPage() {
  const router = useRouter();
  const { sessions, loading, user, refresh } = useStudyData();
  const { design, color } = useMascot();
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  return (
    <>
      <PageTitle
        eyebrow="History"
        title="Your sessions"
        subtitle="Every set of notes you've turned into questions. Tap one to reopen it on the Generate tab."
      />

      {!loading && (!user || sessions.length === 0) ? (
        <div className="mt-10 flex flex-col items-center text-center">
          <Aawax design={design} color={color} mood="idle" size={120} glow float />
          <p className="mt-3 font-serif text-lg text-white">
            {user ? "No sessions yet" : "Sign in to see history"}
          </p>
          <p className="mt-1 max-w-xs text-sm text-white/50">
            {user
              ? "Generate your first question set and it'll show up here."
              : "Your saved sessions appear here once you're signed in."}
          </p>
          <button onClick={() => router.push("/")} className="btn-primary mt-6 max-w-xs">
            Go to Generate
          </button>
        </div>
      ) : (
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
      )}
    </>
  );
}
