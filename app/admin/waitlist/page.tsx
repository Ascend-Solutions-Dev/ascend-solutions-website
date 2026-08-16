import type { Metadata } from "next";
import { requireChatGPTUser } from "../../chatgpt-auth";
import { Footer, Header } from "../../site-shell";
import { isWaitlistAdmin } from "../../waitlist-admin-access";
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

async function WaitlistAdminContent() {
  const user = await requireChatGPTUser("/admin/waitlist");

  if (!isWaitlistAdmin(user)) {
    return <section className="admin-panel"><span className="eyebrow">Restricted</span><h1 className="page-title">Access denied.</h1><p className="page-lead">This account is not authorized to view the Ascend Solutions waitlist.</p></section>;
  }

  const db = await ensureWaitlistSchema();
  const { results } = await db.prepare("SELECT id, email, source, created_at FROM waitlist_signups ORDER BY created_at DESC, id DESC").all<WaitlistRow>();

  return <section className="admin-panel"><div className="admin-heading"><div><span className="eyebrow">Ascend admin</span><h1 className="page-title">Pantrii waitlist</h1><p className="page-lead">{results.length} {results.length === 1 ? "signup" : "signups"}</p></div><a className="button button-orange" href="/api/admin/waitlist?format=csv">Download CSV</a></div>{results.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Email</th><th>Source</th><th>Signup date</th></tr></thead><tbody>{results.map((row) => <tr key={row.id}><td><a href={`mailto:${row.email}`}>{row.email}</a></td><td>{row.source}</td><td>{new Date(`${row.created_at.replace(" ", "T")}Z`).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Denver" })}</td></tr>)}</tbody></table></div> : <div className="empty-state"><h2>No signups yet</h2><p>New Pantrii waitlist submissions will appear here automatically.</p></div>}</section>;
}

export default function WaitlistAdminPage() {
  return <><Header /><main id="main-content" className="admin-main"><WaitlistAdminContent /></main><Footer /></>;
}
