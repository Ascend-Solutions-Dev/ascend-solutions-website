"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

type FormState = "idle" | "submitting" | "success" | "error";

export function WaitlistForm() {
  const [state, setState] = useState<FormState>("idle");
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    if (data.get("company")) return;
    const email = String(data.get("email") || "").trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setState("error");
      setMessage("Enter a valid email address.");
      return;
    }

    setState("submitting");
    setMessage("");

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, source: "pantrii" }),
      });
      const result = await response.json() as { message?: string; error?: string };
      if (!response.ok) throw new Error(result.error || "We could not save your email.");
      setState("success");
      setMessage(result.message || "You’re on the list. We’ll be in touch.");
      form.reset();
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Something went wrong. Please try again.");
    }
  }

  return <form className="waitlist-form" onSubmit={submit} noValidate>
    <label htmlFor="waitlist-email">Email address</label>
    <div className="waitlist-fields"><input id="waitlist-email" name="email" type="email" autoComplete="email" inputMode="email" placeholder="you@example.com" required aria-describedby="waitlist-consent waitlist-status"/><button className="button button-navy" type="submit" disabled={state === "submitting"}>{state === "submitting" ? "Joining…" : "Join the waitlist"}</button></div>
    <input name="company" type="text" tabIndex={-1} autoComplete="off" hidden aria-hidden="true" />
    <p className="waitlist-consent" id="waitlist-consent">We’ll only use your email for Pantrii updates. See our <Link href="/legal#privacy">Privacy Policy</Link>.</p>
    <p className={`form-status ${state}`} id="waitlist-status" role="status" aria-live="polite">{message}</p>
  </form>;
}
