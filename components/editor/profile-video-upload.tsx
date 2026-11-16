"use client";
import { useRef, useState } from "react";
import { uploadProfileVideo } from "@/lib/upload";
export function ProfileVideoUpload({ allowed, userId, value, onChange, onUpsell }: {
  allowed: boolean; userId: string; value?: string;
  onChange: (url?: string, poster?: string) => void; onUpsell: () => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return <div className="space-y-2 border-t border-line pt-4">
    <div className="flex flex-wrap items-center gap-3">
      <button type="button" disabled={busy} className="rounded-full border border-line px-4 py-2 text-sm disabled:opacity-50" onClick={() => allowed ? input.current?.click() : onUpsell()}>{busy ? "Uploading video…" : value ? "Replace video" : "Upload video"}{!allowed && " · Pro"}</button>
      {value && <button type="button" className="text-sm text-danger" onClick={() => onChange()}>Remove video</button>}
    </div>
    <p className="text-xs text-soft">MP4 or WebM · up to 15 seconds and 10 MB. Plays silently; a still image appears when motion is reduced.</p>
    {error && <p role="alert" className="text-sm text-danger">{error}</p>}
    <input ref={input} type="file" hidden accept="video/mp4,video/webm" onChange={async e => {
      const file = e.target.files?.[0]; if (!file || !allowed) return;
      setBusy(true); setError("");
      try { const result = await uploadProfileVideo(file,userId); onChange(result.url,result.poster); }
      catch (e) { setError(e instanceof Error ? e.message : "Video upload failed."); }
      finally { setBusy(false); if(input.current) input.current.value=""; }
    }}/>
  </div>;
}
