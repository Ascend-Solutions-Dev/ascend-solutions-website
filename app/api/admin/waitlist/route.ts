import { getAdminSession } from "../../../admin-auth";
import { ensureWaitlistSchema } from "../../../../db";

type WaitlistRow = {
  id: number;
  email: string;
  source: string;
  created_at: string;
};

function csvCell(value: string | number) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

export async function GET(request: Request) {
  const session = await getAdminSession();
  if (!session) return Response.json({ error: "Sign in required." }, { status: 401, headers: { "cache-control": "private, no-store" } });

  const db = await ensureWaitlistSchema();
  const { results } = await db.prepare("SELECT id, email, source, created_at FROM waitlist_signups ORDER BY created_at DESC, id DESC").all<WaitlistRow>();
  const wantsCsv = new URL(request.url).searchParams.get("format") === "csv";

  if (wantsCsv) {
    const rows = [
      ["Email", "Source", "Signup date"],
      ...results.map((row) => [row.email, row.source, row.created_at]),
    ];
    const csv = rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
    return new Response(csv, {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": "attachment; filename=ascend-app-waitlists.csv",
        "cache-control": "private, no-store",
      },
    });
  }

  return Response.json({ signups: results }, { headers: { "cache-control": "private, no-store" } });
}
