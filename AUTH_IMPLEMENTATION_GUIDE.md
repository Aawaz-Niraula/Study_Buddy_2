# Supabase Auth Integration Guide

## 1. Install Dependencies

Run this command in your project directory:

```bash
npm install @supabase/ssr @supabase/supabase-js @vercel/blob pdf-parse
```

## 2. Create Directory Structure

Create these folders:
```
app/
├── login/
├── register/
└── auth/
    └── callback/
```

## 3. Files to Create

### File: `lib/supabase-client.ts` (ALREADY CREATED)
Browser client for Supabase.

### File: `lib/supabase-server.ts` (ALREADY CREATED)
Server client for Supabase.

### File: `middleware.ts` (ALREADY CREATED)
Session refresh middleware.

---

## 4. Create `app/login/page.tsx`

```tsx
"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-client";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    await migrateLocalHistory();
    router.push("/");
    router.refresh();
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  const migrateLocalHistory = async () => {
    try {
      const guestId = localStorage.getItem("studybuddy_guest_id");
      const localHistory = localStorage.getItem("studybuddy_guest_history");
      
      if (guestId && localHistory) {
        const history = JSON.parse(localHistory);
        if (Array.isArray(history) && history.length > 0) {
          await fetch("/api/migrate-history", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessions: history }),
          });
        }
        localStorage.removeItem("studybuddy_guest_id");
        localStorage.removeItem("studybuddy_guest_history");
      }
    } catch (err) {
      console.error("Failed to migrate history:", err);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#06060b] via-[#0b0b12] to-[#11111a] text-[#f2efff] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-[#857ca2] hover:text-[#a78bfa] transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Study Buddy
        </Link>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-[#a78bfa] to-[#f9a8d4] bg-clip-text text-transparent mb-2">
            Welcome Back
          </h1>
          <p className="text-[#857ca2] text-sm mb-8">
            Sign in to sync your progress across devices
          </p>

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white text-gray-800 font-medium rounded-xl hover:bg-gray-100 transition-colors mb-6"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </motion.button>

          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs text-[#857ca2]">or</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label className="block text-sm text-[#857ca2] mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#857ca2]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-[#f2efff] placeholder-[#857ca2]/50 focus:outline-none focus:border-[#a78bfa]/50 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-[#857ca2] mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#857ca2]" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-11 pr-12 py-3 bg-white/5 border border-white/10 rounded-xl text-[#f2efff] placeholder-[#857ca2]/50 focus:outline-none focus:border-[#a78bfa]/50 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#857ca2] hover:text-[#a78bfa] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-sm">
                {error}
              </motion.p>
            )}

            <motion.button
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-[#a78bfa] to-[#f9a8d4] text-white font-medium rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </motion.button>
          </form>

          <p className="text-center text-sm text-[#857ca2] mt-6">
            Don't have an account?{" "}
            <Link href="/register" className="text-[#a78bfa] hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </motion.div>
    </main>
  );
}
```

---

## 5. Create `app/register/page.tsx`

```tsx
"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-client";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, ArrowLeft, Loader2, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }
    
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    await migrateLocalHistory();
    router.push("/");
    router.refresh();
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  const migrateLocalHistory = async () => {
    try {
      const guestId = localStorage.getItem("studybuddy_guest_id");
      const localHistory = localStorage.getItem("studybuddy_guest_history");
      
      if (guestId && localHistory) {
        const history = JSON.parse(localHistory);
        if (Array.isArray(history) && history.length > 0) {
          await fetch("/api/migrate-history", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessions: history }),
          });
        }
        localStorage.removeItem("studybuddy_guest_id");
        localStorage.removeItem("studybuddy_guest_history");
      }
    } catch (err) {
      console.error("Failed to migrate history:", err);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#06060b] via-[#0b0b12] to-[#11111a] text-[#f2efff] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-[#857ca2] hover:text-[#a78bfa] transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Study Buddy
        </Link>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-[#a78bfa] to-[#f9a8d4] bg-clip-text text-transparent mb-2">
            Create Account
          </h1>
          <p className="text-[#857ca2] text-sm mb-8">
            Sign up to save your progress across devices
          </p>

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white text-gray-800 font-medium rounded-xl hover:bg-gray-100 transition-colors mb-6"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </motion.button>

          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs text-[#857ca2]">or</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm text-[#857ca2] mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#857ca2]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-[#f2efff] placeholder-[#857ca2]/50 focus:outline-none focus:border-[#a78bfa]/50 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-[#857ca2] mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#857ca2]" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-11 pr-12 py-3 bg-white/5 border border-white/10 rounded-xl text-[#f2efff] placeholder-[#857ca2]/50 focus:outline-none focus:border-[#a78bfa]/50 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#857ca2] hover:text-[#a78bfa] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm text-[#857ca2] mb-2">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#857ca2]" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-[#f2efff] placeholder-[#857ca2]/50 focus:outline-none focus:border-[#a78bfa]/50 transition-colors"
                />
              </div>
            </div>

            {error && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-sm">
                {error}
              </motion.p>
            )}

            <motion.button
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-[#a78bfa] to-[#f9a8d4] text-white font-medium rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Create Account"
              )}
            </motion.button>
          </form>

          <p className="text-center text-sm text-[#857ca2] mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-[#a78bfa] hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </main>
  );
}
```

---

## 6. Create `app/auth/callback/route.ts`

```ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const origin = requestUrl.origin;

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, {
                  ...options,
                  domain: ".aawax.me",
                })
              );
            } catch {}
          },
        },
      }
    );

    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(`${origin}/`);
}
```

---

## 7. Create `lib/useAuth.ts`

```ts
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-client";
import type { User } from "@supabase/supabase-js";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return { user, loading, signOut };
}
```

---

## 8. Create `lib/useHistory.ts`

```ts
"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "./useAuth";

const GUEST_ID_KEY = "studybuddy_guest_id";
const GUEST_HISTORY_KEY = "studybuddy_guest_history";

export interface SessionItem {
  id: string;
  title: string;
  updated_at: string;
  latest_mode: string;
  latest_difficulty: string;
  source_kind: string;
}

function getGuestId(): string {
  if (typeof window === "undefined") return "";
  
  let guestId = localStorage.getItem(GUEST_ID_KEY);
  if (!guestId) {
    guestId = crypto.randomUUID();
    localStorage.setItem(GUEST_ID_KEY, guestId);
  }
  return guestId;
}

function getLocalHistory(): SessionItem[] {
  if (typeof window === "undefined") return [];
  
  try {
    const data = localStorage.getItem(GUEST_HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveLocalHistory(sessions: SessionItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(GUEST_HISTORY_KEY, JSON.stringify(sessions));
}

export function useHistory() {
  const { user, loading: authLoading } = useAuth();
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    
    if (user) {
      // Logged in: fetch from API/Turso
      try {
        const res = await fetch("/api/generate");
        const data = await res.json();
        setSessions(Array.isArray(data.sessions) ? data.sessions : []);
      } catch (err) {
        console.error("Failed to load history:", err);
        setSessions([]);
      }
    } else {
      // Guest: load from localStorage
      setSessions(getLocalHistory());
    }
    
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!authLoading) {
      loadHistory();
    }
  }, [authLoading, loadHistory]);

  const addSession = useCallback((session: SessionItem) => {
    setSessions((prev) => {
      const existing = prev.findIndex((s) => s.id === session.id);
      let updated: SessionItem[];
      if (existing >= 0) {
        updated = [...prev];
        updated[existing] = session;
      } else {
        updated = [session, ...prev];
      }
      
      // Save to localStorage for guests
      if (!user) {
        saveLocalHistory(updated);
      }
      
      return updated;
    });
  }, [user]);

  const isGuest = !user && !authLoading;
  const guestId = isGuest ? getGuestId() : null;

  return {
    sessions,
    loading: loading || authLoading,
    isGuest,
    guestId,
    refresh: loadHistory,
    addSession,
  };
}
```

---

## 9. Create `app/api/migrate-history/route.ts`

```ts
import { createClient } from "@libsql/client";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

function getDbClient() {
  if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) return null;
  return createClient({ url: process.env.TURSO_DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN });
}

async function getSupabaseUser() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {},
      },
    }
  );
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function POST(request: Request) {
  try {
    const user = await getSupabaseUser();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sessions } = await request.json();
    if (!Array.isArray(sessions) || sessions.length === 0) {
      return Response.json({ migrated: 0 });
    }

    const db = getDbClient();
    if (!db) {
      return Response.json({ error: "Database not configured" }, { status: 500 });
    }

    // Ensure user_id column exists
    try {
      await db.execute(`ALTER TABLE app_sessions ADD COLUMN user_id TEXT`);
    } catch {}

    let migrated = 0;
    for (const session of sessions) {
      try {
        // Check if session exists
        const existing = await db.execute({
          sql: `SELECT id FROM app_sessions WHERE id = ?`,
          args: [session.id],
        });
        
        if (existing.rows.length === 0) {
          // Insert new session with user_id
          const now = new Date().toISOString();
          await db.execute({
            sql: `INSERT INTO app_sessions (id, user_id, created_at, updated_at, title, source_kind, source_payload_json, generations_json, latest_mode, latest_difficulty, test_submissions_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [
              session.id,
              user.id,
              session.created_at || now,
              session.updated_at || now,
              session.title || "Migrated Session",
              session.source_kind || "text",
              JSON.stringify(session.source_payload || {}),
              JSON.stringify(session.generations || []),
              session.latest_mode || "mix",
              session.latest_difficulty || "medium",
              JSON.stringify(session.test_submissions || []),
            ],
          });
          migrated++;
        } else {
          // Update existing session to claim ownership
          await db.execute({
            sql: `UPDATE app_sessions SET user_id = ? WHERE id = ? AND user_id IS NULL`,
            args: [user.id, session.id],
          });
        }
      } catch (err) {
        console.error(`Failed to migrate session ${session.id}:`, err);
      }
    }

    return Response.json({ migrated });
  } catch (err) {
    console.error("Migration error:", err);
    return Response.json({ error: "Migration failed" }, { status: 500 });
  }
}
```

---

## 10. Update `app/api/generate/route.ts`

Add these changes to your existing route:

### A) Add user authentication helper at the top:

```ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

async function getSupabaseUser() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {},
      },
    }
  );
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}
```

### B) Update `ensureSchema` to add user_id column:

```ts
async function ensureSchema(db: ReturnType<typeof createClient> | null) {
  if (!db) return;
  if (!schemaReadyPromise) {
    schemaReadyPromise = (async () => {
      await db.execute(`CREATE TABLE IF NOT EXISTS app_sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        title TEXT NOT NULL,
        source_kind TEXT NOT NULL,
        source_payload_json TEXT NOT NULL,
        generations_json TEXT NOT NULL,
        test_submissions_json TEXT NOT NULL DEFAULT '[]',
        latest_mode TEXT NOT NULL,
        latest_difficulty TEXT NOT NULL
      )`);
      await db.execute(`CREATE INDEX IF NOT EXISTS idx_app_sessions_updated_at ON app_sessions(updated_at DESC)`);
      await db.execute(`CREATE INDEX IF NOT EXISTS idx_app_sessions_user_id ON app_sessions(user_id)`);
      try {
        await db.execute(`ALTER TABLE app_sessions ADD COLUMN user_id TEXT`);
      } catch {}
      try {
        await db.execute(`ALTER TABLE app_sessions ADD COLUMN test_submissions_json TEXT NOT NULL DEFAULT '[]'`);
      } catch {}
    })();
  }
  await schemaReadyPromise;
}
```

### C) Update `listSessions` to filter by user:

```ts
async function listSessions(userId: string | null) {
  const db = getDbClient();
  if (!db) return [];
  await ensureSchema(db);
  
  let result;
  if (userId) {
    result = await db.execute({
      sql: `SELECT id, created_at, updated_at, title, source_kind, latest_mode, latest_difficulty FROM app_sessions WHERE user_id = ? ORDER BY updated_at DESC LIMIT 50`,
      args: [userId],
    });
  } else {
    // For guests, return empty or sessions without user_id
    return [];
  }
  
  return result.rows.map((row) => ({
    id: String(row.id),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
    title: String(row.title),
    source_kind: String(row.source_kind),
    latest_mode: String(row.latest_mode),
    latest_difficulty: String(row.latest_difficulty),
  }));
}
```

### D) Update GET handler:

```ts
export async function GET(request: Request) {
  const user = await getSupabaseUser();
  const url = new URL(request.url);
  const sessionId = url.searchParams.get("sessionId");
  
  if (sessionId) {
    const session = await getSessionById(sessionId, user?.id ?? null);
    if (!session) return makeResponse(404, { detail: "Session not found." });
    return makeResponse(200, { session });
  }
  
  const sessions = await listSessions(user?.id ?? null);
  return makeResponse(200, { sessions });
}
```

### E) Update `saveGeneration` to include user_id:

Add `userId` parameter and include it in INSERT.

---

## 11. Create `app/api/upload-pdf/route.ts` (Vercel Blob)

```ts
import { put, del } from "@vercel/blob";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB

async function getSupabaseUser() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {},
      },
    }
  );
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function POST(request: Request) {
  let blobUrl: string | null = null;
  
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    
    if (!file) {
      return Response.json({ error: "No file provided" }, { status: 400 });
    }
    
    if (file.size > MAX_FILE_SIZE) {
      return Response.json(
        { error: `File too large. Maximum size is 15MB, got ${(file.size / 1024 / 1024).toFixed(2)}MB` },
        { status: 400 }
      );
    }
    
    if (file.type !== "application/pdf") {
      return Response.json({ error: "Only PDF files are allowed" }, { status: 400 });
    }

    // Upload to Vercel Blob
    const blob = await put(file.name, file, {
      access: "public",
      addRandomSuffix: true,
    });
    blobUrl = blob.url;

    // Extract text using pdf-parse
    const pdfParse = (await import("pdf-parse")).default;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const pdfData = await pdfParse(buffer);
    const extractedText = pdfData.text;

    return Response.json({
      success: true,
      text: extractedText,
      filename: file.name,
      pages: pdfData.numpages,
    });
  } catch (error) {
    console.error("PDF upload error:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to process PDF" },
      { status: 500 }
    );
  } finally {
    // Always delete the blob after processing
    if (blobUrl) {
      try {
        await del(blobUrl);
        console.log(`Deleted blob: ${blobUrl}`);
      } catch (deleteError) {
        console.error(`Failed to delete blob ${blobUrl}:`, deleteError);
      }
    }
  }
}
```

---

## 12. Turso Schema SQL

Run this SQL in your Turso database to add the user_id column if needed:

```sql
-- Add user_id column for auth
ALTER TABLE app_sessions ADD COLUMN user_id TEXT;

-- Create index for faster user queries
CREATE INDEX IF NOT EXISTS idx_app_sessions_user_id ON app_sessions(user_id);
```

---

## 13. Environment Variables

Make sure these are set in Vercel:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
BLOB_READ_WRITE_TOKEN=your_vercel_blob_token
TURSO_DATABASE_URL=your_turso_url
TURSO_AUTH_TOKEN=your_turso_token
GROQ_API_KEY=your_groq_key
```

---

## 14. Supabase Dashboard Settings

1. **Disable email verification:**
   - Go to Authentication → Providers → Email
   - Turn OFF "Confirm email"

2. **Enable Google OAuth:**
   - Go to Authentication → Providers → Google
   - Add your Google OAuth credentials
   - Set redirect URL to: `https://studybuddy.aawax.me/auth/callback`

3. **Update Site URL:**
   - Go to Authentication → URL Configuration
   - Set Site URL to: `https://studybuddy.aawax.me`

---

## Summary

After implementing all these files:

1. ✅ Guest users can use the app with localStorage storage
2. ✅ Sign in with Email/Password or Google OAuth
3. ✅ On sign in, localStorage history migrates to Turso
4. ✅ Logged in users get server-side history from Turso
5. ✅ PDFs up to 15MB upload to Vercel Blob, extract text, then auto-delete
6. ✅ Cookies shared across *.aawax.me subdomains
7. ✅ No features blocked behind login
