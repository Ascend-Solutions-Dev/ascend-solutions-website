import type { Metadata } from "next";
import { getAdminSession } from "../../admin-auth";
import { AdminLoginForm } from "../../admin-login-form";
import { Footer, Header } from "../../site-shell";
import { ensureWaitlistSchema } from "../../../db";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Waitlist Admin",
  robots: { index: false, follow: false },
};

type WaitlistRow = {
  id: number;
  email: string;
  source: string;
  created_at: string;
};

async function WaitlistAdminContent({ error }: { error?: string }) {
  const session = await getAdminSession();
  if (!session) return <section className="admin-login"><span className="eyebrow">Ascend admin</span><h1 className="page-title">Waitlist access</h1><p className="page-lead">Sign in with an authorized Ascend Solutions email address.</p>{error === "invalid-link" ? <p className="admin-auth-error" role="alert">That sign-in link is invalid, expired, or has already been used.</p> : null}{error === "configuration" ? <p className="admin-auth-error" role="alert">Admin sign-in is not fully configured yet.</p> : null}<AdminLoginForm /></section>;

  const db = await ensureWaitlistSchema();
  const { results } = await db.prepare("SELECT id, email, source, created_at FROM waitlist_signups ORDER BY created_at DESC, id DESC").all<WaitlistRow>();

  return <section className="admin-panel"><div className="admin-heading"><div><span className="eyebrow">Ascend admin</span><h1 className="page-title">App waitlists</h1><p className="page-lead">{results.length} {results.length === 1 ? "signup" : "signups"} across all apps</p><p className="admin-signed-in">Signed in as {session.email}</p></div><div className="admin-actions"><a className="button button-orange" href="/api/admin/waitlist?format=csv">Download CSV</a><form action="/api/admin/auth/logout" method="post"><button className="button button-outline" type="submit">Sign out</button></form></div></div>{results.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Email</th><th>App</th><th>Signup date</th></tr></thead><tbody>{results.map((row) => <tr key={row.id}><td><a href={`mailto:${row.email}`}>{row.email}</a></td><td>{row.source}</td><td>{new Date(`${row.created_at.replace(" ", "T")}Z`).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Denver" })}</td></tr>)}</tbody></table></div> : <div className="empty-state"><h2>No signups yet</h2><p>New app waitlist submissions will appear here automatically.</p></div>}</section>;
}

export default async function WaitlistAdminPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return <><Header /><main id="main-content" className="admin-main"><WaitlistAdminContent error={error} /></main><Footer /></>;
}
