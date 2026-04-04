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
