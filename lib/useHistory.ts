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
      const timer = window.setTimeout(() => {
        void loadHistory();
      }, 0);
      return () => window.clearTimeout(timer);
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
    user,
    refresh: loadHistory,
    addSession,
  };
}
