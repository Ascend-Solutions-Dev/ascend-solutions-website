import { clearAdminSessionCookie } from "../../../../admin-auth";

export async function POST(request: Request) {
  const secure = new URL(request.url).protocol === "https:";
  return new Response(null, {
    status: 303,
    headers: {
      location: new URL("/admin/waitlist", request.url).toString(),
      "set-cookie": clearAdminSessionCookie(secure),
      "cache-control": "no-store",
    },
  });
}
