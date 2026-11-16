"use client";
import { useEffect, useRef, useState } from "react";
import { uploadImage } from "@/lib/upload";

export function CoverPhotoPicker({ value, userId, allowed, onChange, onUpsell }: {
  value?: string; userId: string; allowed: boolean;
  onChange: (value: string | undefined) => void; onUpsell: () => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const mounted = useRef(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  return <section className="rounded-2xl border border-line bg-surface p-4" aria-label="Cover photo">
    <div className="flex items-center justify-between gap-3"><h3 className="text-sm font-semibold">Cover photo</h3><span className="rounded bg-ink px-2 py-0.5 text-[10px] font-semibold text-white">PRO</span></div>
    <p className="mt-1 text-xs leading-relaxed text-soft">The wide photo above your avatar. Your profile photo stays separate.</p>
    {value && <img src={value} alt="Current cover photo" className="mt-3 aspect-[2/1] w-full rounded-xl object-cover" />}
    <input ref={input} type="file" accept="image/*" hidden disabled={busy || !allowed || !userId} aria-label="Choose cover photo" onChange={async e => {
      const file = e.target.files?.[0]; e.target.value = "";
      if (!file || !allowed || !userId || busy) return;
      setBusy(true); setError("");
      try { const url = await uploadImage(file, userId); if (mounted.current) onChange(url); }
      catch (err) { if (mounted.current) setError(err instanceof Error ? err.message : "Upload failed. Please try again."); }
      finally { if (mounted.current) setBusy(false); }
    }} />
    <div className="mt-3 flex flex-wrap items-center gap-3">
      <button type="button" className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-white disabled:opacity-50" disabled={busy || !allowed || !userId} onClick={() => allowed ? input.current?.click() : onUpsell()}>{busy ? "Uploading…" : value ? "Change cover photo" : "Upload cover photo"}</button>
      {value && <button type="button" className="text-sm text-danger" disabled={busy || !allowed} onClick={() => {setError("");onChange(undefined);}}>Remove cover photo</button>}
    </div>
    {error && <p role="alert" className="mt-2 text-sm text-danger">{error}</p>}
    {busy && <p role="status" className="mt-2 text-xs text-soft">Optimising and uploading your cover…</p>}
  </section>;
}
