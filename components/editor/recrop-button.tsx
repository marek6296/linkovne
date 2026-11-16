"use client";
import { useState } from "react";
import { recropImage } from "@/lib/upload";
export function RecropButton({
  url,
  userId,
  aspect,
  disabled,
  onChange,
}: {
  url: string;
  userId: string;
  aspect?: number;
  disabled?: boolean;
  onChange: (url: string) => void;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  return (
    <>
      <button
        type="button"
        disabled={disabled || busy}
        className="rounded-full border border-line px-4 py-2 text-sm disabled:opacity-50"
        onClick={async () => {
          setBusy(true);
          setError("");
          try {
            onChange(await recropImage(url, userId, aspect));
          } catch (e) {
            if (e instanceof Error && e.name !== "AbortError")
              setError(e.message);
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? "Adjusting…" : "Adjust crop"}
      </button>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </>
  );
}
