"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { Trophy, Target, FolderOpen, Sparkles } from "lucide-react";
import { PageTitle } from "@/components/layout/PageTitle";
import { Aawax } from "@/components/mascot/Aawax";
import { useMascot } from "@/lib/mascot/MascotContext";
import { useStudyData } from "@/lib/useStudyData";
import { countWrongByType } from "@/lib/reviewQuestions";

export default function ProgressPage() {
  const { sessions, tests, loading, user } = useStudyData();
  const { design, color, openChat } = useMascot();

  const data = useMemo(() => {
    const chrono = [...tests].sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at));
    const points = chrono.map((t) => ({
      pct: t.total ? Math.round((t.score / t.total) * 100) : 0,
      title: t.sessionTitle || "Test",
    }));
    const pcts = points.map((p) => p.pct);
    const avg = pcts.length ? Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length) : 0;
    const best = pcts.length ? Math.max(...pcts) : 0;

    const wrong = { mcq: 0, tf: 0, sa: 0 };
    for (const t of tests) {
      const c = countWrongByType(
        t.questions as Parameters<typeof countWrongByType>[0],
        t.answers,
        t.shortAnswerEvaluations
      );
      wrong.mcq += c.mcq;
      wrong.tf += c.tf;
      wrong.sa += c.sa;
    }
    const totalWrong = wrong.mcq + wrong.tf + wrong.sa;
    let weakest: string | null = null;
    if (totalWrong > 0) {
      const max = Math.max(wrong.mcq, wrong.tf, wrong.sa);
      weakest = wrong.sa === max ? "short-answer" : wrong.mcq === max ? "multiple-choice" : "true/false";
    }

    return { points, avg, best, wrong, totalWrong, weakest, tests: tests.length, sessions: sessions.length };
  }, [tests, sessions]);

  if (!loading && (!user || tests.length === 0)) {
    return (
      <>
        <PageTitle eyebrow="Progress" title="Track your growth" subtitle="Your scores and trends, all in one place." />
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

  const improveCopy =
    data.weakest === "short-answer"
      ? "You miss the most short-answer questions. Those test deep conceptual understanding, so focus on understanding the why, not just the facts."
      : data.weakest === "multiple-choice"
        ? "Most of your slips are on multiple-choice. Slow down and rule out the distractors one by one."
        : data.weakest === "true/false"
          ? "True or false trips you up most. Watch for absolute words like always and never."
          : "Nice and balanced. Keep practicing to push your average even higher.";

  return (
    <>
      <PageTitle eyebrow="Progress" title="Track your growth" subtitle="Your scores and trends, all in one place." />

      {/* Average ring */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="app-card flex items-center gap-5"
      >
        <div className="h-28 w-28 shrink-0">
          <CircularProgressbar
            value={data.avg}
            text={`${data.avg}%`}
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
          <p className="font-serif text-2xl text-white">across {data.tests} tests</p>
          <p className="mt-1 text-sm" style={{ color: "var(--accent-soft)" }}>
            {data.avg >= 70 ? "You're on fire!" : data.avg >= 50 ? "Solid progress." : "Keep practicing!"}
          </p>
        </div>
      </motion.div>

      {/* Stat tiles */}
      <div className="mt-4 grid grid-cols-3 gap-3">
        <StatTile icon={<Trophy className="h-5 w-5" />} label="Best" value={`${data.best}%`} delay={0.05} />
        <StatTile icon={<Target className="h-5 w-5" />} label="Tests" value={`${data.tests}`} delay={0.1} />
        <StatTile icon={<FolderOpen className="h-5 w-5" />} label="Sessions" value={`${data.sessions}`} delay={0.15} />
      </div>

      {/* Score trend graph */}
      <h2 className="mb-3 mt-8 text-[11px] font-bold uppercase tracking-[0.22em] text-white/40">Score trend</h2>
      <div className="app-card">
        <TrendChart points={data.points.map((p) => p.pct)} />
      </div>

      {/* Where to improve */}
      <h2 className="mb-3 mt-8 text-[11px] font-bold uppercase tracking-[0.22em] text-white/40">
        Where to improve
      </h2>
      <div className="app-card">
        <div className="mb-4 grid grid-cols-3 gap-3">
          <WrongTile label="Multiple choice" value={data.wrong.mcq} />
          <WrongTile label="True / false" value={data.wrong.tf} />
          <WrongTile label="Short answer" value={data.wrong.sa} highlight={data.weakest === "short-answer"} />
        </div>
        <p className="text-sm leading-relaxed text-white/65">{improveCopy}</p>
        <button
          onClick={() => openChat("Where do I need to improve?")}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-full border py-2.5 text-sm font-semibold transition-colors cursor-pointer"
          style={{
            borderColor: "rgba(var(--accent-glow),0.4)",
            background: "rgba(var(--accent-glow),0.12)",
            color: "var(--accent-soft)",
          }}
        >
          <Sparkles className="h-4 w-4" /> Ask Aawax about my progress
        </button>
      </div>
    </>
  );
}

// ─── Animated SVG line/area chart ───────────────────────────────
function TrendChart({ points }: { points: number[] }) {
  const W = 320;
  const H = 140;
  const PAD = 14;

  if (points.length === 0) return <p className="py-6 text-center text-sm text-white/40">No tests yet.</p>;

  const xs = (i: number) =>
    points.length === 1 ? W / 2 : PAD + (i * (W - PAD * 2)) / (points.length - 1);
  const ys = (v: number) => H - PAD - (v / 100) * (H - PAD * 2);

  const linePath = points.map((v, i) => `${i === 0 ? "M" : "L"} ${xs(i)} ${ys(v)}`).join(" ");
  const areaPath = `${linePath} L ${xs(points.length - 1)} ${H - PAD} L ${xs(0)} ${H - PAD} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(var(--accent-glow), 0.35)" />
          <stop offset="100%" stopColor="rgba(var(--accent-glow), 0)" />
        </linearGradient>
      </defs>

      {/* gridlines */}
      {[0, 25, 50, 75, 100].map((g) => (
        <g key={g}>
          <line x1={PAD} y1={ys(g)} x2={W - PAD} y2={ys(g)} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
          <text x={0} y={ys(g) + 3} fontSize="8" fill="rgba(255,255,255,0.3)">
            {g}
          </text>
        </g>
      ))}

      <motion.path
        d={areaPath}
        fill="url(#trend-fill)"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      />
      <motion.path
        d={linePath}
        fill="none"
        stroke="var(--accent)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1, ease: "easeOut" }}
      />
      {points.map((v, i) => (
        <motion.circle
          key={i}
          cx={xs(i)}
          cy={ys(v)}
          r="3.5"
          fill="var(--accent-soft)"
          stroke="#06060b"
          strokeWidth="2"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5 + i * 0.06 }}
        />
      ))}
    </svg>
  );
}

function StatTile({ icon, label, value, delay }: { icon: React.ReactNode; label: string; value: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4 text-center"
    >
      <div
        className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-full"
        style={{ background: "rgba(var(--accent-glow),0.14)", color: "var(--accent-soft)" }}
      >
        {icon}
      </div>
      <p className="font-serif text-xl text-white">{value}</p>
      <p className="text-[11px] uppercase tracking-wider text-white/40">{label}</p>
    </motion.div>
  );
}

function WrongTile({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div
      className="rounded-2xl border p-3 text-center"
      style={{
        borderColor: highlight ? "rgba(var(--accent-glow),0.45)" : "rgba(255,255,255,0.07)",
        background: highlight ? "rgba(var(--accent-glow),0.1)" : "rgba(255,255,255,0.03)",
      }}
    >
      <p className="font-serif text-2xl text-white">{value}</p>
      <p className="mt-0.5 text-[10px] uppercase tracking-wider text-white/40">{label}</p>
    </div>
  );
}
