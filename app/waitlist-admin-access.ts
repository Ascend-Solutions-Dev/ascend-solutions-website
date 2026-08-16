import type { ChatGPTUser } from "./chatgpt-auth";

const WAITLIST_ADMIN_USER_IDS = new Set([
  "d7f85f34-fa18-4927-98fa-b64f596195ca",
]);

export function isWaitlistAdmin(user: ChatGPTUser | null): user is ChatGPTUser {
  return Boolean(user && WAITLIST_ADMIN_USER_IDS.has(user.userId));
}
