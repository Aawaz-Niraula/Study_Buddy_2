// ─── Aawax mascot design system config ──────────────────────────────
// Central source of truth for the mascot's designs, color themes, and moods.
// The same data drives the SVG mascot, the Dress-Up Room, and the live
// accent theming applied across the app.

export type MascotDesign = "classic" | "snake" | "boxy" | "kitty";
export type MascotColor = "violet" | "cyan" | "coral" | "green" | "gold";
export type MascotMood = "idle" | "listen" | "think" | "cheer" | "sing" | "oops";

export type ColorTheme = {
  id: MascotColor;
  label: string;
  /** lighter top tone of the mascot gradient */
  from: string;
  /** richer bottom tone of the mascot gradient */
  to: string;
  /** primary accent used for buttons, highlights, icons */
  accent: string;
  /** softer accent for subtle fills/borders */
  accentSoft: string;
  /** rgba used for glow halos */
  glow: string;
  /** the signature "different shade" foot */
  footAlt: string;
};

export const COLOR_THEMES: Record<MascotColor, ColorTheme> = {
  violet: {
    id: "violet",
    label: "Violet",
    from: "#d8b4fe",
    to: "#9333ea",
    accent: "#a855f7",
    accentSoft: "#c084fc",
    glow: "167, 139, 250",
    footAlt: "#818cf8",
  },
  cyan: {
    id: "cyan",
    label: "Cyan",
    from: "#a5f3fc",
    to: "#2563eb",
    accent: "#22d3ee",
    accentSoft: "#67e8f9",
    glow: "56, 189, 248",
    footAlt: "#7dd3fc",
  },
  coral: {
    id: "coral",
    label: "Coral",
    from: "#fecdd3",
    to: "#e11d48",
    accent: "#fb7185",
    accentSoft: "#fda4af",
    glow: "251, 113, 133",
    footAlt: "#fb923c",
  },
  green: {
    id: "green",
    label: "Green",
    from: "#d9f99d",
    to: "#16a34a",
    accent: "#4ade80",
    accentSoft: "#86efac",
    glow: "74, 222, 128",
    footAlt: "#34d399",
  },
  gold: {
    id: "gold",
    label: "Gold",
    from: "#fde68a",
    to: "#ea580c",
    accent: "#fbbf24",
    accentSoft: "#fcd34d",
    glow: "251, 191, 36",
    footAlt: "#f472b6",
  },
};

export const COLOR_ORDER: MascotColor[] = ["violet", "cyan", "coral", "green", "gold"];

export type DesignMeta = {
  id: MascotDesign;
  label: string;
  /** caption shown under the preview — changes per design, not per mood */
  caption: string;
};

export const DESIGNS: Record<MascotDesign, DesignMeta> = {
  classic: { id: "classic", label: "Classic", caption: "The original stage presence" },
  snake: { id: "snake", label: "Snake", caption: "A sssmooth talker" },
  boxy: { id: "boxy", label: "Boxy", caption: "Sharp suit energy" },
  kitty: { id: "kitty", label: "Kitty", caption: "Ears. Whiskers. Authority." },
};

export const DESIGN_ORDER: MascotDesign[] = ["classic", "snake", "boxy", "kitty"];

export type MoodMeta = { id: MascotMood; label: string };

export const MOODS: Record<MascotMood, MoodMeta> = {
  idle: { id: "idle", label: "Idle" },
  listen: { id: "listen", label: "Listen" },
  think: { id: "think", label: "Think" },
  cheer: { id: "cheer", label: "Cheer" },
  sing: { id: "sing", label: "Sing" },
  oops: { id: "oops", label: "Oops" },
};

export const MOOD_ORDER: MascotMood[] = ["idle", "listen", "think", "cheer", "sing", "oops"];

export const MASCOT_NAME = "Aawax";
