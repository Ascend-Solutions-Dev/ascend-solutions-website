"use client";

import { FormEvent, useState } from "react";

export function AdminLoginForm() {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setMessage("");
    const data = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/admin/auth/request", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: data.get("email") }),
      });
      const result = await response.json() as { message?: string; error?: string };
      if (!response.ok) throw new Error(result.error || "We could not send the sign-in link.");
      setStatus("success");
      setMessage(result.message || "Check your email for a sign-in link.");
      event.currentTarget.reset();
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "We could not send the sign-in link.");
    }
  }

  return <form className="admin-login-form" onSubmit={submit} noValidate>
    <label htmlFor="admin-email">Ascend email address</label>
    <input id="admin-email" name="email" type="email" autoComplete="email" placeholder="you@ascendsolutions.dev" required aria-describedby="admin-login-help admin-login-status" />
    <button className="button button-orange" type="submit" disabled={status === "submitting"}>{status === "submitting" ? "Sending…" : "Email me a sign-in link"}</button>
    <p id="admin-login-help">The link expires after 15 minutes and can only be used once.</p>
    <p className={`form-status ${status}`} id="admin-login-status" role="status" aria-live="polite">{message}</p>
  </form>;
}
