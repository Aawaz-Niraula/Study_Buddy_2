"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { LogOut, LogIn, Palette, Volume2, VolumeX, Check } from "lucide-react";
import { PageTitle } from "@/components/layout/PageTitle";
import { Aawax } from "@/components/mascot/Aawax";
import { useAuth } from "@/lib/useAuth";
import { useMascot } from "@/lib/mascot/MascotContext";
import { COLOR_THEMES, COLOR_ORDER, MASCOT_NAME } from "@/lib/mascot/config";

export default function AccountPage() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { design, color, soundOn, setColor, toggleSound, openDressUp, playBoop } = useMascot();

  return (
    <>
      <PageTitle
        eyebrow="Account"
        title="You & Aawax"
        subtitle="Manage your account and dress up your study companion."
      />

      {/* Mascot + identity */}
      <div className="app-card flex flex-col items-center text-center">
        <Aawax design={design} color={color} mood="cheer" size={120} glow sparkles interactive onBoop={playBoop} />
        <p className="mt-2 font-serif text-lg text-white">{user ? "Signed in" : "Guest"}</p>
        <p className="text-sm text-white/50">{user?.email ?? "Sign in to save your progress"}</p>
      </div>

      {/* Quick color */}
      <h2 className="mb-3 mt-6 text-[11px] font-bold uppercase tracking-[0.22em] text-white/40">Theme</h2>
      <div className="app-card flex justify-between gap-2">
        {COLOR_ORDER.map((c) => {
          const t = COLOR_THEMES[c];
          const active = c === color;
          return (
            <button
              key={c}
              onClick={() => setColor(c)}
              aria-label={t.label}
              className="flex h-11 w-11 items-center justify-center rounded-full transition-transform hover:scale-105 cursor-pointer"
              style={{
                background: `linear-gradient(160deg, ${t.from}, ${t.to})`,
                boxShadow: active ? `0 0 0 3px #0d0d15, 0 0 0 5px ${t.accent}` : "none",
              }}
            >
              {active && <Check className="h-5 w-5 text-white" strokeWidth={3} />}
            </button>
          );
        })}
      </div>

      {/* Actions */}
      <div className="mt-6 space-y-3">
        <button onClick={openDressUp} className="btn-primary">
          <Palette className="h-4 w-4" /> Customise {MASCOT_NAME}
        </button>

        <button onClick={toggleSound} className="btn-outline w-full">
          {soundOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          Interaction sounds: {soundOn ? "On" : "Off"}
        </button>

        {user ? (
          <button
            onClick={async () => {
              await signOut();
              router.refresh();
            }}
            className="btn-outline w-full"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        ) : (
          <Link href="/login" className="btn-outline w-full">
            <LogIn className="h-4 w-4" /> Sign in
          </Link>
        )}
      </div>

      <p className="mt-6 text-center text-xs text-white/35">
        Saved automatically · {MASCOT_NAME} remembers · made by aawaz
      </p>
    </>
  );
}
