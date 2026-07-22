"use client";

import { useState } from "react";
import type { Theme } from "@/lib/themes";

export function ContactForm({
  profileId,
  blockId,
  title,
  buttonLabel,
  theme,
  preview = false,
}: {
  profileId: string;
  blockId: string;
  title?: string;
  buttonLabel?: string;
  theme: Theme;
  /** V editore sa nic neodosiela — formular je len na ukazku. */
  preview?: boolean;
}) {
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">(
    "idle",
  );

  const inputStyle = {
    background: theme.page.includes("gradient")
      ? "rgba(255,255,255,0.75)"
      : theme.btnBg,
    border: theme.btnBorder,
    color: theme.text,
  };

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (preview) return;

    const form = new FormData(e.currentTarget);
    // Honeypot: roboty vyplnia skryte pole, ludia nie.
    if (String(form.get("company") ?? "")) {
      setState("done");
      return;
    }

    setState("sending");
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId,
          blockId,
          name: form.get("name"),
          email: form.get("email"),
          message: form.get("message"),
        }),
      });
      setState(res.ok ? "done" : "error");
    } catch {
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <div
        className="px-5 py-6 text-center text-sm"
        style={{
          border: theme.btnBorder,
          borderRadius: theme.btnRadius === "999px" ? "18px" : theme.btnRadius,
          background: theme.btnBg,
        }}
      >
        <p className="font-medium">Thank you — message sent.</p>
        <p className="mt-1" style={{ color: theme.muted }}>
          You&apos;ll hear back soon.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-2.5 px-5 py-5"
      style={{
        border: theme.btnBorder,
        borderRadius: theme.btnRadius === "999px" ? "18px" : theme.btnRadius,
        background: theme.btnBg,
      }}
    >
      {title && <p className="mb-1 text-sm font-semibold">{title}</p>}

      <input
        name="name"
        required
        maxLength={100}
        placeholder="Your name"
        className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
        style={inputStyle}
      />
      <input
        name="email"
        type="email"
        required
        maxLength={200}
        placeholder="you@example.com"
        className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
        style={inputStyle}
      />
      <textarea
        name="message"
        rows={3}
        maxLength={2000}
        placeholder="Your message"
        className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
        style={inputStyle}
      />

      {/* honeypot */}
      <input
        name="company"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
        className="absolute h-0 w-0 opacity-0"
      />

      <button
        type="submit"
        disabled={state === "sending"}
        className="w-full py-2.5 text-sm font-medium transition disabled:opacity-60"
        style={{
          background: theme.text,
          // Rovnaky dovod ako pri featured odkaze — btnBg byva priehladny
          color:
            theme.page.includes("gradient") || theme.page.includes("url(")
              ? "#fff"
              : theme.page,
          borderRadius: theme.btnRadius,
        }}
      >
        {state === "sending" ? "Sending…" : (buttonLabel ?? "Send")}
      </button>

      {state === "error" && (
        <p className="text-center text-xs" style={{ color: "#c2402a" }}>
          Couldn&apos;t send. Please try again.
        </p>
      )}
    </form>
  );
}
