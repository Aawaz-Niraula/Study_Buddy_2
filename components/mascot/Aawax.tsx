"use client";

import { useId, useState } from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { COLOR_THEMES, type MascotColor, type MascotDesign, type MascotMood } from "@/lib/mascot/config";

type AawaxProps = {
  design?: MascotDesign;
  color?: MascotColor;
  mood?: MascotMood;
  size?: number;
  /** show the soft radial halo behind the mascot (hero contexts) */
  glow?: boolean;
  /** show floating sparkles/stars around the mascot (hero contexts) */
  sparkles?: boolean;
  /** enable the tap-to-boop squash & stretch interaction */
  interactive?: boolean;
  /** gentle idle float/breathing loop */
  float?: boolean;
  onBoop?: () => void;
  className?: string;
  title?: string;
};

// ─── Per-mood pose configuration ────────────────────────────────────
type Pose = { tilt: number; armsUp: boolean };
const POSE: Record<MascotMood, Pose> = {
  idle: { tilt: 0, armsUp: false },
  listen: { tilt: -7, armsUp: false },
  think: { tilt: 8, armsUp: false },
  cheer: { tilt: 0, armsUp: true },
  sing: { tilt: -3, armsUp: false },
  oops: { tilt: 5, armsUp: false },
};

export function Aawax({
  design = "classic",
  color = "violet",
  mood = "idle",
  size = 160,
  glow = false,
  sparkles = false,
  interactive = false,
  float = true,
  onBoop,
  className = "",
  title,
}: AawaxProps) {
  const uid = useId().replace(/:/g, "");
  const theme = COLOR_THEMES[color];
  const reduce = useReducedMotion();
  const [booping, setBooping] = useState(false);
  const pose = POSE[mood];

  const handleBoop = () => {
    if (!interactive) return;
    setBooping(true);
    onBoop?.();
    window.setTimeout(() => setBooping(false), 420);
  };

  // Idle breathing + tap boop are both expressed on the inner group.
  const bodyVariants: Variants = {
    rest: { scale: 1, y: 0 },
    float: reduce
      ? { scale: 1, y: 0 }
      : { y: [0, -5, 0], transition: { duration: 3.4, repeat: Infinity, ease: "easeInOut" } },
    boop: reduce
      ? { scale: 1 }
      : { scale: [1, 0.86, 1.08, 0.97, 1], transition: { duration: 0.42, ease: "easeOut" } },
  };

  return (
    <motion.div
      className={`relative inline-flex items-center justify-center ${interactive ? "cursor-pointer select-none" : ""} ${className}`}
      style={{ width: size, height: size }}
      onClick={handleBoop}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleBoop();
              }
            }
          : undefined
      }
      role={interactive ? "button" : "img"}
      aria-label={title ?? `Aawax mascot (${design}, ${color}, ${mood})`}
      tabIndex={interactive ? 0 : undefined}
    >
      <motion.svg
        viewBox="0 0 200 200"
        width={size}
        height={size}
        variants={bodyVariants}
        initial="rest"
        animate={booping ? "boop" : float ? "float" : "rest"}
        style={{ overflow: "visible" }}
      >
        <defs>
          <linearGradient id={`body-${uid}`} x1="0.5" y1="0" x2="0.5" y2="1">
            <stop offset="0%" stopColor={theme.from} />
            <stop offset="100%" stopColor={theme.to} />
          </linearGradient>
          <radialGradient id={`halo-${uid}`} cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor={`rgba(${theme.glow}, 0.45)`} />
            <stop offset="55%" stopColor={`rgba(${theme.glow}, 0.12)`} />
            <stop offset="100%" stopColor={`rgba(${theme.glow}, 0)`} />
          </radialGradient>
          <filter id={`orb-${uid}`} x="-150%" y="-150%" width="400%" height="400%">
            <feGaussianBlur stdDeviation="3.2" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Soft halo behind the mascot */}
        {glow && <circle cx="100" cy="108" r="98" fill={`url(#halo-${uid})`} />}

        {/* Floating sparkles / starfield */}
        {sparkles && <Sparkles reduce={!!reduce} accent={theme.accent} />}

        {/* The mascot rig - tilts per mood */}
        <g transform={`rotate(${pose.tilt} 100 116)`}>
          {/* Feet (one a signature different shade) */}
          <ellipse cx="80" cy="168" rx="15" ry="9.5" fill={theme.footAlt} />
          <ellipse cx="120" cy="168" rx="15" ry="9.5" fill={theme.to} />

          {/* Arms */}
          <Arms uid={uid} armsUp={pose.armsUp} fill={`url(#body-${uid})`} />

          {/* Kitty ears tuck behind the head */}
          {design === "kitty" && (
            <>
              <path d="M64 70 L58 36 L86 58 Z" fill={`url(#body-${uid})`} />
              <path d="M136 70 L142 36 L114 58 Z" fill={`url(#body-${uid})`} />
              <path d="M66 64 L63 47 L78 58 Z" fill={`rgba(${theme.glow}, 0.55)`} />
              <path d="M134 64 L137 47 L122 58 Z" fill={`rgba(${theme.glow}, 0.55)`} />
            </>
          )}

          {/* Body - wider than tall blob */}
          <ellipse cx="100" cy="116" rx="60" ry="52" fill={`url(#body-${uid})`} />

          {/* Antenna + glowing orb */}
          <Antenna uid={uid} design={design} accent={theme.accent} reduce={!!reduce} />

          {/* Boxy robot bolts */}
          {design === "boxy" && (
            <>
              <rect x="40" y="112" width="7" height="7" rx="1.6" fill="rgba(0,0,0,0.18)" />
              <rect x="153" y="112" width="7" height="7" rx="1.6" fill="rgba(0,0,0,0.18)" />
            </>
          )}

          {/* Cheeks */}
          <ellipse cx="68" cy="126" rx="9" ry="5.5" fill="rgba(255,120,170,0.45)" />
          <ellipse cx="132" cy="126" rx="9" ry="5.5" fill="rgba(255,120,170,0.45)" />

          {/* Face (eyes + mouth) per mood */}
          <Face mood={mood} />

          {/* Snake tongue */}
          {design === "snake" && (
            <path
              d="M100 140 L100 152 M100 152 L95 159 M100 152 L105 159"
              stroke="#e1366b"
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
            />
          )}

          {/* Kitty whiskers */}
          {design === "kitty" && (
            <g stroke="rgba(20,12,40,0.5)" strokeWidth="2" strokeLinecap="round">
              <line x1="44" y1="120" x2="62" y2="122" />
              <line x1="44" y1="128" x2="62" y2="128" />
              <line x1="156" y1="120" x2="138" y2="122" />
              <line x1="156" y1="128" x2="138" y2="128" />
            </g>
          )}

          {/* Oops sweat drop */}
          {mood === "oops" && (
            <path d="M140 96 q5 8 0 12 q-5 -4 0 -12 Z" fill="rgba(120,200,255,0.85)" />
          )}

          {/* Sing music note */}
          {mood === "sing" && (
            <g fill={theme.accent}>
              <circle cx="150" cy="96" r="4.5" />
              <rect x="153.5" y="78" width="2.6" height="18" />
              <path d="M156.1 78 q8 1 8 7 q-4 -3 -8 -2 Z" />
            </g>
          )}
        </g>
      </motion.svg>
    </motion.div>
  );
}

// ─── Arms ───────────────────────────────────────────────────────────
function Arms({ uid, armsUp, fill }: { uid: string; armsUp: boolean; fill: string }) {
  void uid;
  if (armsUp) {
    return (
      <>
        <ellipse cx="44" cy="84" rx="11" ry="16" fill={fill} transform="rotate(-32 44 84)" />
        <ellipse cx="156" cy="84" rx="11" ry="16" fill={fill} transform="rotate(32 156 84)" />
      </>
    );
  }
  return (
    <>
      <ellipse cx="38" cy="118" rx="11" ry="16" fill={fill} transform="rotate(-24 38 118)" />
      <ellipse cx="162" cy="118" rx="11" ry="16" fill={fill} transform="rotate(24 162 118)" />
    </>
  );
}

// ─── Antenna ────────────────────────────────────────────────────────
function Antenna({
  uid,
  design,
  accent,
  reduce,
}: {
  uid: string;
  design: MascotDesign;
  accent: string;
  reduce: boolean;
}) {
  const orb = (
    <motion.circle
      cx="120"
      cy="22"
      r="6"
      fill={accent}
      filter={`url(#orb-${uid})`}
      animate={reduce ? undefined : { opacity: [0.7, 1, 0.7], r: [5.4, 6.4, 5.4] }}
      transition={reduce ? undefined : { duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
    />
  );

  if (design === "boxy") {
    // segmented / robotic antenna
    return (
      <>
        <line x1="100" y1="66" x2="112" y2="40" stroke="#cbb6f0" strokeWidth="3" />
        <rect x="106" y="30" width="14" height="12" rx="2" fill={accent} filter={`url(#orb-${uid})`} />
      </>
    );
  }

  return (
    <>
      <path d="M100 66 Q104 40 120 26" stroke="#e9defb" strokeWidth="3" fill="none" strokeLinecap="round" />
      {orb}
    </>
  );
}

// ─── Face ───────────────────────────────────────────────────────────
function Face({ mood }: { mood: MascotMood }) {
  const EYE = "#221636";
  const happyEyes = mood === "cheer";

  return (
    <>
      {/* Eyes */}
      {happyEyes ? (
        <g stroke={EYE} strokeWidth="4.5" fill="none" strokeLinecap="round">
          <path d="M74 110 q8 -11 16 0" />
          <path d="M110 110 q8 -11 16 0" />
        </g>
      ) : mood === "oops" ? (
        <>
          <circle cx="82" cy="110" r="9" fill="#fff" />
          <circle cx="118" cy="110" r="9" fill="#fff" />
          <circle cx="82" cy="111" r="5" fill={EYE} />
          <circle cx="118" cy="111" r="5" fill={EYE} />
        </>
      ) : (
        <>
          <ellipse cx="82" cy={mood === "think" ? 106 : 110} rx="7" ry="9" fill={EYE} />
          <ellipse cx="118" cy={mood === "think" ? 106 : 110} rx="7" ry="9" fill={EYE} />
          <circle cx="84.5" cy={(mood === "think" ? 106 : 110) - 3} r="2.4" fill="#fff" />
          <circle cx="120.5" cy={(mood === "think" ? 106 : 110) - 3} r="2.4" fill="#fff" />
        </>
      )}

      {/* Mouth */}
      {mood === "sing" ? (
        <ellipse cx="100" cy="135" rx="8" ry="11" fill={EYE} />
      ) : mood === "oops" ? (
        <circle cx="100" cy="135" r="6" fill={EYE} />
      ) : mood === "cheer" ? (
        <path d="M82 128 q18 24 36 0 q-18 6 -36 0 Z" fill={EYE} />
      ) : mood === "think" ? (
        <path d="M92 134 q8 5 16 0" stroke={EYE} strokeWidth="4" fill="none" strokeLinecap="round" />
      ) : (
        <path d="M86 130 q14 16 28 0" stroke={EYE} strokeWidth="4" fill="none" strokeLinecap="round" />
      )}
    </>
  );
}

// ─── Sparkles / starfield ───────────────────────────────────────────
function Sparkles({ reduce, accent }: { reduce: boolean; accent: string }) {
  const stars = [
    { x: 28, y: 40, r: 2.4, d: 0 },
    { x: 172, y: 56, r: 1.8, d: 0.6 },
    { x: 40, y: 150, r: 1.6, d: 1.1 },
    { x: 168, y: 140, r: 2.2, d: 0.3 },
    { x: 150, y: 28, r: 1.4, d: 0.9 },
    { x: 24, y: 96, r: 1.5, d: 1.4 },
  ];
  return (
    <g>
      {stars.map((s, i) => (
        <motion.circle
          key={i}
          cx={s.x}
          cy={s.y}
          r={s.r}
          fill={i % 2 === 0 ? accent : "rgba(255,255,255,0.85)"}
          animate={reduce ? undefined : { opacity: [0.2, 1, 0.2], scale: [0.8, 1.2, 0.8] }}
          transition={
            reduce ? undefined : { duration: 2.6, repeat: Infinity, ease: "easeInOut", delay: s.d }
          }
        />
      ))}
      {/* a couple of four-point sparkles */}
      <motion.path
        d="M120 150 l2 5 l5 2 l-5 2 l-2 5 l-2 -5 l-5 -2 l5 -2 Z"
        fill="rgba(255,255,255,0.9)"
        animate={reduce ? undefined : { opacity: [0.3, 1, 0.3], rotate: [0, 90, 0] }}
        transition={reduce ? undefined : { duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: "122px 157px" }}
      />
    </g>
  );
}
