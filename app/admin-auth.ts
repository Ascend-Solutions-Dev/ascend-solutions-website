import { headers } from "next/headers";

const ADMIN_COOKIE = "ascend_admin_session";
const SESSION_SECONDS = 8 * 60 * 60;

export const WAITLIST_ADMIN_EMAILS = new Set([
  "skyler@ascendsolutions.dev",
  "chris@ascendsolutions.dev",
  "aaron@ascendsolutions.dev",
]);

type AdminSession = { email: string; expiresAt: number };

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

function textToBase64Url(value: string) {
  return bytesToBase64Url(new TextEncoder().encode(value));
}

function base64UrlToText(value: string) {
  const normalized = value.replaceAll("-", "+").replaceAll("_", "/");
  const binary = atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "="));
  return new TextDecoder().decode(Uint8Array.from(binary, (character) => character.charCodeAt(0)));
}

async function getSecret() {
  try {
    const { env } = await import("cloudflare:workers");
    return env.ADMIN_SESSION_SECRET?.trim() || "";
  } catch {
    return process.env.ADMIN_SESSION_SECRET?.trim() || "";
  }
}

async function sign(value: string, secret: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return bytesToBase64Url(new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value))));
}

function constantTimeEqual(left: string, right: string) {
  if (left.length !== right.length) return false;
  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return mismatch === 0;
}

export function isWaitlistAdminEmail(email: string) {
  return WAITLIST_ADMIN_EMAILS.has(email.trim().toLowerCase());
}

export async function createAdminSessionCookie(email: string, secure = true) {
  const secret = await getSecret();
  if (!secret) throw new Error("ADMIN_SESSION_SECRET is not configured.");
  const payload = textToBase64Url(JSON.stringify({ email: email.toLowerCase(), expiresAt: Math.floor(Date.now() / 1000) + SESSION_SECONDS }));
  const signature = await sign(payload, secret);
  return `${ADMIN_COOKIE}=${payload}.${signature}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_SECONDS}${secure ? "; Secure" : ""}`;
}

export function clearAdminSessionCookie(secure = true) {
  return `${ADMIN_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure ? "; Secure" : ""}`;
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const cookieHeader = (await headers()).get("cookie") || "";
  const cookie = cookieHeader.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${ADMIN_COOKIE}=`));
  if (!cookie) return null;
  const secret = await getSecret();
  if (!secret) return null;
  const [payload, signature] = cookie.slice(ADMIN_COOKIE.length + 1).split(".");
  if (!payload || !signature || !constantTimeEqual(signature, await sign(payload, secret))) return null;
  try {
    const session = JSON.parse(base64UrlToText(payload)) as AdminSession;
    if (!isWaitlistAdminEmail(session.email) || !Number.isFinite(session.expiresAt) || session.expiresAt <= Math.floor(Date.now() / 1000)) return null;
    return session;
  } catch {
    return null;
  }
}

export async function hashMagicLinkToken(token: string) {
  return bytesToBase64Url(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token))));
}

export function createMagicLinkToken() {
  return bytesToBase64Url(crypto.getRandomValues(new Uint8Array(32)));
}
