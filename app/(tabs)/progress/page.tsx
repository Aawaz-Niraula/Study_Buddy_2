"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { Trophy, Target, FolderOpen } from "lucide-react";
import { PageTitle } from "@/components/layout/PageTitle";
import { Aawax } from "@/components/mascot/Aawax";
import { useMascot } from "@/lib/mascot/MascotContext";
import { useStudyData } from "@/lib/useStudyData";

export default function ProgressPage() {
  const { sessions, tests, loading, user } = useStudyData();
  const { design, color } = useMascot();

  const stats = useMemo(() => {
    const pcts = tests.map((t) => (t.total ? (t.score / t.total) * 100 : 0));
    const avg = pcts.length ? Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length) : 0;
    const best = pcts.length ? Math.round(Math.max(...pcts)) : 0;
    return { avg, best, tests: tests.length, sessions: sessions.length };
  }, [tests, sessions]);

  const recent = tests.slice(0, 6);

  if (!loading && (!user || tests.length === 0)) {
    return (
      <>
        <PageTitle eyebrow="Progress" title="Track your growth" subtitle="Your scores and streaks, all in one place." />
        <div className="mt-10 flex flex-col items-center text-center">
          <Aawax design={design} color={color} mood="cheer" size={120} glow float />
          <p className="mt-3 font-serif text-lg text-white">No data yet</p>
          <p className="mt-1 max-w-xs text-sm text-white/50">
            Take a few tests and watch your average score climb here.
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <PageTitle
        eyebrow="Progress"
        title="Track your growth"
        subtitle="Your scores and streaks, all in one place."
      />

      {/* Average score ring */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="app-card flex items-center gap-5"
      >
        <div className="h-28 w-28 shrink-0">
          <CircularProgressbar
            value={stats.avg}
            text={`${stats.avg}%`}
            styles={buildStyles({
              textColor: "#fff",
              textSize: "22px",
              pathColor: "var(--accent)",
              trailColor: "rgba(255,255,255,0.08)",
              pathTransitionDuration: 1,
            })}
          />
        </div>
        <div>
          <p className="text-sm text-white/45">Average score</p>
          <p className="font-serif text-2xl text-white">across {stats.tests} tests</p>
          <p className="mt-1 text-sm" style={{ color: "var(--accent-soft)" }}>
            {stats.avg >= 70 ? "You're on fire! 🔥" : stats.avg >= 50 ? "Solid progress." : "Keep practicing!"}
          </p>
        </div>
      </motion.div>

      {/* Stat tiles */}
      <div className="mt-4 grid grid-cols-3 gap-3">
        <StatTile icon={<Trophy className="h-5 w-5" />} label="Best" value={`${stats.best}%`} delay={0.05} />
        <StatTile icon={<Target className="h-5 w-5" />} label="Tests" value={`${stats.tests}`} delay={0.1} />
        <StatTile icon={<FolderOpen className="h-5 w-5" />} label="Sessions" value={`${stats.sessions}`} delay={0.15} />
      </div>

      {/* Recent scores */}
      <h2 className="mb-3 mt-8 text-[11px] font-bold uppercase tracking-[0.22em] text-white/40">
        Recent scores
      </h2>
      <div className="space-y-2.5">
        {recent.map((t, i) => {
          const pct = t.total ? Math.round((t.score / t.total) * 100) : 0;
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-3.5"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="truncate pr-2 text-sm text-white/80">{t.sessionTitle || "Test"}</span>
                <span className="shrink-0 text-sm font-semibold" style={{ color: "var(--accent-soft)" }}>
                  {pct}%
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: "linear-gradient(90deg, var(--accent-soft), var(--accent))" }}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.8, delay: i * 0.05 + 0.1, ease: "easeOut" }}
                />
              </div>
            </motion.div>
          );
        })}
      </div>
    </>
  );
}

function StatTile({
  icon,
  label,
  value,
  delay,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4 text-center"
    >
      <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-full" style={{ background: "rgba(var(--accent-glow),0.14)", color: "var(--accent-soft)" }}>
        {icon}
      </div>
      <p className="font-serif text-xl text-white">{value}</p>
      <p className="text-[11px] uppercase tracking-wider text-white/40">{label}</p>
    </motion.div>
  );
}
