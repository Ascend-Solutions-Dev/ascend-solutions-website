declare namespace Cloudflare {
  interface Env {
    DB: D1Database;
    ADMIN_SESSION_SECRET?: string;
    RESEND_API_KEY?: string;
    RESEND_FROM_EMAIL?: string;
  }
}
