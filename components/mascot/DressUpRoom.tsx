"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Shuffle, Volume2, VolumeX } from "lucide-react";
import { useMascot } from "@/lib/mascot/MascotContext";
import { Aawax } from "./Aawax";
import {
  COLOR_THEMES,
  COLOR_ORDER,
  DESIGNS,
  DESIGN_ORDER,
  MOODS,
  MOOD_ORDER,
  MASCOT_NAME,
} from "@/lib/mascot/config";

export function DressUpRoom() {
  const {
    design,
    color,
    mood,
    soundOn,
    dressUpOpen,
    setDesign,
    setColor,
    setMood,
    toggleSound,
    surpriseMe,
    closeDressUp,
    playBoop,
  } = useMascot();

  return (
    <AnimatePresence>
      {dressUpOpen && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={closeDressUp}
            aria-hidden
          />

          {/* Sheet */}
          <motion.div
            className="relative w-full sm:max-w-md max-h-[92vh] overflow-y-auto hide-scrollbar rounded-t-3xl sm:rounded-3xl border border-white/10 bg-[#0d0d15] p-5 shadow-2xl"
            initial={{ y: "100%", opacity: 0.6 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0.4 }}
            transition={{ type: "spring", damping: 30, stiffness: 320 }}
            role="dialog"
            aria-modal="true"
            aria-label={`Customise ${MASCOT_NAME}`}
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-2xl text-white">
                Customise <span style={{ color: "var(--accent)" }}>{MASCOT_NAME}</span>
              </h2>
              <button
                onClick={closeDressUp}
                aria-label="Close"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-white/70 transition-colors hover:bg-white/10 hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Preview card */}
            <div className="mt-4 rounded-2xl bg-gradient-to-b from-[#15131f] to-[#0a0a12] border border-white/[0.06] p-5">
              <div className="flex flex-col items-center">
                <Aawax
                  design={design}
                  color={color}
                  mood={mood}
                  size={172}
                  glow
                  sparkles
                  interactive
                  onBoop={playBoop}
                />
                <p
                  className="mt-1 text-[10px] font-semibold uppercase tracking-[0.25em]"
                  style={{ color: "var(--accent-soft)" }}
                >
                  Tap to boop
                </p>
                <p className="mt-2 text-center text-sm text-white/70 font-serif italic">
                  {DESIGNS[design].caption}
                </p>
              </div>

              {/* Mood pills */}
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {MOOD_ORDER.map((m) => {
                  const active = m === mood;
                  return (
                    <button
                      key={m}
                      onClick={() => setMood(m)}
                      className="rounded-full px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer"
                      style={
                        active
                          ? { background: "var(--accent)", color: "#0a0a12" }
                          : { background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.6)" }
                      }
                    >
                      {MOODS[m].label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* DESIGN */}
            <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.22em] text-white/40">
              Design
            </p>
            <div className="mt-2 grid grid-cols-4 gap-2.5">
              {DESIGN_ORDER.map((d) => {
                const active = d === design;
                return (
                  <button
                    key={d}
                    onClick={() => setDesign(d)}
                    aria-label={DESIGNS[d].label}
                    aria-pressed={active}
                    className="flex flex-col items-center gap-1 rounded-2xl border p-2 transition-all cursor-pointer"
                    style={{
                      borderColor: active ? "var(--accent)" : "rgba(255,255,255,0.08)",
                      background: active ? "rgba(var(--accent-glow), 0.12)" : "rgba(255,255,255,0.02)",
                      boxShadow: active ? "0 0 18px rgba(var(--accent-glow), 0.35)" : "none",
                    }}
                  >
                    <Aawax design={d} color={color} mood="idle" size={46} float={false} />
                    <span
                      className="text-[10px] font-medium"
                      style={{ color: active ? "var(--accent-soft)" : "rgba(255,255,255,0.5)" }}
                    >
                      {DESIGNS[d].label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* COLOR */}
            <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.22em] text-white/40">
              Color
            </p>
            <div className="mt-2 flex justify-between gap-3 px-1">
              {COLOR_ORDER.map((c) => {
                const t = COLOR_THEMES[c];
                const active = c === color;
                return (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    aria-label={t.label}
                    aria-pressed={active}
                    className="flex h-12 w-12 items-center justify-center rounded-full transition-transform cursor-pointer hover:scale-105"
                    style={{
                      background: `linear-gradient(160deg, ${t.from}, ${t.to})`,
                      boxShadow: active
                        ? `0 0 0 3px #0d0d15, 0 0 0 5px ${t.accent}, 0 0 16px rgba(${t.glow},0.5)`
                        : "none",
                    }}
                  >
                    {active && <Check className="h-5 w-5 text-white drop-shadow" strokeWidth={3} />}
                  </button>
                );
              })}
            </div>

            {/* Divider */}
            <div className="my-5 h-px bg-white/10" />

            {/* Surprise + Sound */}
            <div className="flex gap-3">
              <button
                onClick={surpriseMe}
                className="flex flex-1 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10 cursor-pointer"
              >
                <Shuffle className="h-4 w-4" /> Surprise Me
              </button>
              <button
                onClick={toggleSound}
                aria-pressed={soundOn}
                className="flex flex-1 items-center justify-center gap-2 rounded-full border py-3 text-sm font-semibold transition-colors cursor-pointer"
                style={{
                  borderColor: soundOn ? "var(--accent)" : "rgba(255,255,255,0.1)",
                  background: soundOn ? "rgba(var(--accent-glow),0.14)" : "rgba(255,255,255,0.05)",
                  color: soundOn ? "var(--accent-soft)" : "#fff",
                }}
              >
                {soundOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                Sound {soundOn ? "On" : "Off"}
              </button>
            </div>

            <p className="mt-4 text-center text-xs text-white/40">
              Saved automatically · {MASCOT_NAME} remembers
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
