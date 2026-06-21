"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import {
  COLOR_THEMES,
  COLOR_ORDER,
  DESIGN_ORDER,
  type MascotColor,
  type MascotDesign,
  type MascotMood,
} from "./config";

const STORAGE_KEY = "aawax-prefs-v1";

type MascotPrefs = {
  design: MascotDesign;
  color: MascotColor;
  soundOn: boolean;
};

const DEFAULT_PREFS: MascotPrefs = {
  design: "classic",
  color: "violet",
  soundOn: false,
};

type MascotContextValue = {
  design: MascotDesign;
  color: MascotColor;
  mood: MascotMood;
  soundOn: boolean;
  /** Dress-Up Room open state */
  dressUpOpen: boolean;
  setDesign: (d: MascotDesign) => void;
  setColor: (c: MascotColor) => void;
  setMood: (m: MascotMood) => void;
  toggleSound: () => void;
  surpriseMe: () => void;
  openDressUp: () => void;
  closeDressUp: () => void;
  playBoop: () => void;
};

const MascotContext = createContext<MascotContextValue | null>(null);

/** Apply the selected color theme to the document root as CSS variables. */
function applyTheme(color: MascotColor) {
  if (typeof document === "undefined") return;
  const theme = COLOR_THEMES[color];
  const root = document.documentElement;
  root.style.setProperty("--mascot-from", theme.from);
  root.style.setProperty("--mascot-to", theme.to);
  root.style.setProperty("--mascot-foot-alt", theme.footAlt);
  root.style.setProperty("--accent", theme.accent);
  root.style.setProperty("--accent-soft", theme.accentSoft);
  root.style.setProperty("--accent-glow", theme.glow);
}

export function MascotProvider({ children }: { children: ReactNode }) {
  const [design, setDesignState] = useState<MascotDesign>(DEFAULT_PREFS.design);
  const [color, setColorState] = useState<MascotColor>(DEFAULT_PREFS.color);
  const [soundOn, setSoundOn] = useState<boolean>(DEFAULT_PREFS.soundOn);
  const [mood, setMood] = useState<MascotMood>("idle");
  const [dressUpOpen, setDressUpOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Load persisted prefs once on mount ("Aawax remembers").
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<MascotPrefs>;
        if (parsed.design && DESIGN_ORDER.includes(parsed.design)) setDesignState(parsed.design);
        if (parsed.color && COLOR_ORDER.includes(parsed.color)) setColorState(parsed.color);
        if (typeof parsed.soundOn === "boolean") setSoundOn(parsed.soundOn);
        applyTheme(parsed.color && COLOR_ORDER.includes(parsed.color) ? parsed.color : DEFAULT_PREFS.color);
      } else {
        applyTheme(DEFAULT_PREFS.color);
      }
    } catch {
      applyTheme(DEFAULT_PREFS.color);
    }
    setHydrated(true);
  }, []);

  // Persist whenever prefs change.
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ design, color, soundOn }));
    } catch {
      /* ignore quota / privacy mode errors */
    }
  }, [design, color, soundOn, hydrated]);

  const setColor = useCallback((c: MascotColor) => {
    setColorState(c);
    applyTheme(c);
  }, []);

  const setDesign = useCallback((d: MascotDesign) => setDesignState(d), []);

  const toggleSound = useCallback(() => setSoundOn((s) => !s), []);

  const surpriseMe = useCallback(() => {
    const d = DESIGN_ORDER[Math.floor(Math.random() * DESIGN_ORDER.length)];
    const c = COLOR_ORDER[Math.floor(Math.random() * COLOR_ORDER.length)];
    setDesignState(d);
    setColor(c);
  }, [setColor]);

  const playBoop = useCallback(() => {
    if (!soundOn || typeof window === "undefined") return;
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(420, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.24);
      osc.onended = () => ctx.close();
    } catch {
      /* audio not available */
    }
  }, [soundOn]);

  const openDressUp = useCallback(() => setDressUpOpen(true), []);
  const closeDressUp = useCallback(() => setDressUpOpen(false), []);

  return (
    <MascotContext.Provider
      value={{
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
        openDressUp,
        closeDressUp,
        playBoop,
      }}
    >
      {children}
    </MascotContext.Provider>
  );
}

export function useMascot() {
  const ctx = useContext(MascotContext);
  if (!ctx) throw new Error("useMascot must be used within a MascotProvider");
  return ctx;
}
