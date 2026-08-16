import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export async function getDb() {
  return drizzle(await getD1(), { schema });
}

export async function getD1() {
  const { env } = await import("cloudflare:workers");
  if (!env.DB) {
    throw new Error(
      "Cloudflare D1 binding `DB` is unavailable. Set the `d1` field in .openai/hosting.json to `DB` or let your control plane inject the real binding values before using the database."
    );
  }

  return env.DB;
}

export async function ensureWaitlistSchema() {
  const db = await getD1();
  await db.batch([
    db.prepare("CREATE TABLE IF NOT EXISTS waitlist_signups (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, email TEXT NOT NULL, source TEXT DEFAULT 'pantrii' NOT NULL, created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL)"),
    db.prepare("DROP INDEX IF EXISTS idx_waitlist_signups_email"),
    db.prepare("CREATE UNIQUE INDEX IF NOT EXISTS idx_waitlist_signups_email_source ON waitlist_signups (email, source)"),
    db.prepare("CREATE TABLE IF NOT EXISTS admin_magic_links (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, email TEXT NOT NULL, token_hash TEXT NOT NULL, expires_at INTEGER NOT NULL, consumed_at INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL)"),
    db.prepare("CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_magic_links_token_hash ON admin_magic_links (token_hash)"),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_admin_magic_links_email_created_at ON admin_magic_links (email, created_at)"),
  ]);
  return db;
}
