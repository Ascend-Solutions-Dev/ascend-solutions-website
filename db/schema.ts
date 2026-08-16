import { sql } from "drizzle-orm";
import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const waitlistSignups = sqliteTable("waitlist_signups", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull(),
  source: text("source").notNull().default("pantrii"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [uniqueIndex("idx_waitlist_signups_email").on(table.email)]);
