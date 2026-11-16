"use client";

import { useState } from "react";
import { readableText } from "@/lib/design";
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
    background: "#ffffff",
    border: theme.btnBorder,
    color: "#202027",
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
          color:theme.btnText,
        }}
      >
        <p className="font-medium">Thank you — message sent.</p>
        <p className="mt-1" style={{ color: "inherit",opacity:.7 }}>
          You&apos;ll hear back soon.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="block-surface space-y-2.5 px-5 py-5"
      style={{
        border: theme.btnBorder,
        borderRadius: theme.btnRadius === "999px" ? "18px" : theme.btnRadius,
        background: theme.btnBg,
        color:theme.btnText,
      }}
    >
      {title && <p className="mb-1 text-sm font-semibold">{title}</p>}

      <input
        name="name"
        aria-label="Your name"
        autoComplete="name"
        required
        maxLength={100}
        placeholder="Your name"
        className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
        style={inputStyle}
      />
      <input
        name="email"
        aria-label="Email address"
        autoComplete="email"
        type="email"
        required
        maxLength={200}
        placeholder="you@example.com"
        className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
        style={inputStyle}
      />
      <textarea
        name="message"
        aria-label="Your message"
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
          color: readableText(theme.text),
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
