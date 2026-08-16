import { ensureWaitlistSchema } from "../../../db";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    const payload = await request.json() as { email?: unknown; source?: unknown };
    const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
    const requestedSource = typeof payload.source === "string" ? payload.source.trim().toLowerCase() : "";
    const source = /^[a-z0-9-]{1,40}$/.test(requestedSource) ? requestedSource : "website";

    if (!email || email.length > 254 || !EMAIL_PATTERN.test(email)) {
      return Response.json({ error: "Enter a valid email address." }, { status: 400 });
    }

    const db = await ensureWaitlistSchema();
    const result = await db.prepare("INSERT INTO waitlist_signups (email, source) VALUES (?, ?) ON CONFLICT(email, source) DO NOTHING").bind(email, source).run();
    const created = (result.meta.changes || 0) > 0;

    return Response.json({ message: "You’re on the list. We’ll be in touch." }, { status: created ? 201 : 200 });
  } catch (error) {
    console.error("Waitlist signup failed", error);
    return Response.json({ error: "We could not save your email. Please try again." }, { status: 500 });
  }
}
