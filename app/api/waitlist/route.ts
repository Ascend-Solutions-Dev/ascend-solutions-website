import { getD1 } from "../../../db";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    const payload = await request.json() as { email?: unknown; source?: unknown };
    const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
    const source = payload.source === "pantrii" ? "pantrii" : "website";

    if (!email || email.length > 254 || !EMAIL_PATTERN.test(email)) {
      return Response.json({ error: "Enter a valid email address." }, { status: 400 });
    }

    const db = await getD1();
    await db.batch([
      db.prepare("CREATE TABLE IF NOT EXISTS waitlist_signups (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, email TEXT NOT NULL, source TEXT DEFAULT 'pantrii' NOT NULL, created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL)"),
      db.prepare("CREATE UNIQUE INDEX IF NOT EXISTS idx_waitlist_signups_email ON waitlist_signups (email)"),
    ]);
    const result = await db.prepare("INSERT INTO waitlist_signups (email, source) VALUES (?, ?) ON CONFLICT(email) DO NOTHING").bind(email, source).run();
    const created = (result.meta.changes || 0) > 0;

    return Response.json({ message: "You’re on the list. We’ll be in touch." }, { status: created ? 201 : 200 });
  } catch (error) {
    console.error("Waitlist signup failed", error);
    return Response.json({ error: "We could not save your email. Please try again." }, { status: 500 });
  }
}
