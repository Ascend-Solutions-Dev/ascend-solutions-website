import { getChatGPTUser } from "../../../chatgpt-auth";
import { ensureWaitlistSchema } from "../../../../db";
import { isWaitlistAdmin } from "../../../waitlist-admin-access";

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
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Sign in required." }, { status: 401 });
  if (!isWaitlistAdmin(user)) return Response.json({ error: "Access denied." }, { status: 403 });

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
        "content-disposition": "attachment; filename=pantrii-waitlist.csv",
        "cache-control": "private, no-store",
      },
    });
  }

  return Response.json({ signups: results }, { headers: { "cache-control": "private, no-store" } });
}
