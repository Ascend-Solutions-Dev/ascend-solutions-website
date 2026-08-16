import { createAdminSessionCookie, hashMagicLinkToken } from "../../../../admin-auth";
import { ensureWaitlistSchema } from "../../../../../db";

function redirect(request: Request, path: string, cookie?: string) {
  const headers = new Headers({ location: new URL(path, request.url).toString(), "cache-control": "no-store" });
  if (cookie) headers.set("set-cookie", cookie);
  return new Response(null, { status: 303, headers });
}

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token") || "";
  if (token.length < 32 || token.length > 128) return redirect(request, "/admin/waitlist?error=invalid-link");

  const db = await ensureWaitlistSchema();
  const now = Math.floor(Date.now() / 1000);
  const tokenHash = await hashMagicLinkToken(token);
  const record = await db.prepare("UPDATE admin_magic_links SET consumed_at = ? WHERE token_hash = ? AND consumed_at IS NULL AND expires_at > ? RETURNING email").bind(now, tokenHash, now).first<{ email: string }>();
  if (!record?.email) return redirect(request, "/admin/waitlist?error=invalid-link");

  try {
    const secure = new URL(request.url).protocol === "https:";
    return redirect(request, "/admin/waitlist", await createAdminSessionCookie(record.email, secure));
  } catch (error) {
    console.error("Admin session creation failed", error);
    return redirect(request, "/admin/waitlist?error=configuration");
  }
}
