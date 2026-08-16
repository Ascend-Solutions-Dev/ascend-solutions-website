import { createMagicLinkToken, hashMagicLinkToken, isWaitlistAdminEmail } from "../../../../admin-auth";
import { ensureWaitlistSchema } from "../../../../../db";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LINK_LIFETIME_SECONDS = 15 * 60;
const GENERIC_MESSAGE = "If that address is authorized, a sign-in link is on its way.";

function escapeHtml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  return !origin || origin === new URL(request.url).origin;
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: "Invalid request origin." }, { status: 403 });

  let config: { RESEND_API_KEY?: string; ADMIN_SESSION_SECRET?: string; RESEND_FROM_EMAIL?: string } = {
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    ADMIN_SESSION_SECRET: process.env.ADMIN_SESSION_SECRET,
    RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
  };
  try {
    const { env } = await import("cloudflare:workers");
    config = env;
  } catch {
    // Node-based build tests use process.env; the deployed Worker supplies cloudflare:workers.
  }
  if (!config.RESEND_API_KEY || !config.ADMIN_SESSION_SECRET) {
    return Response.json({ error: "Admin email sign-in is still being configured." }, { status: 503 });
  }

  let email = "";
  try {
    const payload = await request.json() as { email?: unknown };
    email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
  } catch {
    return Response.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  if (!email || email.length > 254 || !EMAIL_PATTERN.test(email)) {
    return Response.json({ error: "Enter a valid email address." }, { status: 400 });
  }
  if (!isWaitlistAdminEmail(email)) return Response.json({ message: GENERIC_MESSAGE });

  const db = await ensureWaitlistSchema();
  const recent = await db.prepare("SELECT COUNT(*) AS count FROM admin_magic_links WHERE email = ? AND created_at > datetime('now', '-15 minutes')").bind(email).first<{ count: number }>();
  if ((recent?.count || 0) >= 3) return Response.json({ message: GENERIC_MESSAGE });

  const token = createMagicLinkToken();
  const tokenHash = await hashMagicLinkToken(token);
  const expiresAt = Math.floor(Date.now() / 1000) + LINK_LIFETIME_SECONDS;
  const signInUrl = new URL("/api/admin/auth/verify", request.url);
  signInUrl.searchParams.set("token", token);

  await db.batch([
    db.prepare("DELETE FROM admin_magic_links WHERE expires_at < ?").bind(Math.floor(Date.now() / 1000) - 86400),
    db.prepare("INSERT INTO admin_magic_links (email, token_hash, expires_at) VALUES (?, ?, ?)").bind(email, tokenHash, expiresAt),
  ]);

  const from = config.RESEND_FROM_EMAIL?.trim() || "Ascend Solutions <admin@ascendsolutions.dev>";
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${config.RESEND_API_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({
      from,
      to: [email],
      subject: "Your Ascend Solutions admin sign-in link",
      text: `Sign in to the Ascend Solutions waitlist admin: ${signInUrl.toString()}\n\nThis link expires in 15 minutes and can only be used once.`,
      html: `<div style="font-family:Arial,sans-serif;color:#022b46;line-height:1.6"><h1 style="font-size:24px">Sign in to Ascend Solutions</h1><p>Use the secure link below to view the waitlist.</p><p><a href="${escapeHtml(signInUrl.toString())}" style="display:inline-block;padding:12px 18px;border-radius:10px;background:#ff8a00;color:#022b46;font-weight:700;text-decoration:none">Open waitlist admin</a></p><p style="font-size:13px;color:#596773">This link expires in 15 minutes and can only be used once.</p></div>`,
    }),
  });

  if (!response.ok) {
    console.error("Resend magic-link email failed", response.status, await response.text());
    await db.prepare("DELETE FROM admin_magic_links WHERE token_hash = ?").bind(tokenHash).run();
    return Response.json({ error: "We could not send the sign-in link. Please try again." }, { status: 502 });
  }

  return Response.json({ message: GENERIC_MESSAGE });
}
