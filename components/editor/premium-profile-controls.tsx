"use client";
import { useState } from "react";
import {
  PROFILE_SURFACES,
  PROFILE_HOVERS,
  PROFILE_MOTIONS,
  PROFILE_ENTRANCES,
  type Design,
} from "@/lib/design";
import { uploadImage } from "@/lib/upload";
export function PremiumProfileControls({
  design,
  allowed,
  userId,
  onChange,
  onUpsell,
}: {
  design: Design;
  allowed: boolean;
  userId: string;
  onChange: (patch: Partial<Design>) => void;
  onUpsell: () => void;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const choice = (
    label: string,
    key: keyof Design,
    options: Record<string, string>,
    fallback: string,
  ) => (
    <label className="block text-xs font-medium">
      {label}
      <select
        className="field mt-2 w-full"
        value={String(design[key] ?? fallback)}
        onChange={(e) =>
          allowed ? onChange({ [key]: e.target.value }) : onUpsell()
        }
      >
        {Object.entries(options).map(([value, text]) => (
          <option key={value} value={value}>
            {text}
          </option>
        ))}
      </select>
    </label>
  );
  return (
    <section className="space-y-4 border-t border-line pt-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Profile details & motion</h3>
        <span className="rounded bg-ink px-2 py-0.5 text-[10px] font-semibold text-white">
          PRO
        </span>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {choice("Surface", "profileSurface", PROFILE_SURFACES, "default")}
        {choice(
          "Link arrangement",
          "linkArrangement",
          { stack: "Stack", grid: "Paired grid" },
          "stack",
        )}
        {choice(
          "Button treatment",
          "buttonTreatment",
          { default: "Original", soft: "Soft depth", tile: "Large tiles" },
          "default",
        )}
        {choice("Entrance", "profileEntrance", PROFILE_ENTRANCES, "none")}
        {choice("On hover", "profileHover", PROFILE_HOVERS, "none")}
        {choice("Continuous motion", "profileMotion", PROFILE_MOTIONS, "none")}
      </div>
      {design.linkArrangement === "grid" && (
        <p className="text-xs text-soft">
          Text links are paired. Featured links and image cards stay full width.
          Block order stays the same.
        </p>
      )}
      <label className="flex items-center justify-between text-sm">
        Effect colour
        <input
          type="color"
          value={design.profileAccent ?? "#3448ef"}
          onChange={(e) =>
            allowed ? onChange({ profileAccent: e.target.value }) : onUpsell()
          }
        />
      </label>
      <label className="block text-xs font-medium">
        Caption beneath the header
        <input
          className="field mt-2 w-full"
          value={design.profileCaption ?? ""}
          maxLength={180}
          placeholder="Open for collaborations"
          onChange={(e) =>
            allowed ? onChange({ profileCaption: e.target.value }) : onUpsell()
          }
        />
      </label>
      {design.profileHover === "flip" && (
        <div className="space-y-3">
          <label className="block text-xs">
            Back title
            <input
              className="field mt-1 w-full"
              maxLength={100}
              value={design.profileBackTitle ?? ""}
              onChange={(e) =>
                allowed
                  ? onChange({ profileBackTitle: e.target.value })
                  : onUpsell()
              }
            />
          </label>
          <label className="block text-xs">
            Back text
            <textarea
              className="field mt-1 w-full"
              rows={4}
              maxLength={500}
              value={design.profileBackText ?? ""}
              onChange={(e) =>
                allowed
                  ? onChange({ profileBackText: e.target.value })
                  : onUpsell()
              }
            />
          </label>
          <p className="text-xs text-soft">
            Hover to turn on desktop, tap on mobile. Your links remain below
            both sides.
          </p>
        </div>
      )}
      {design.profileLayout === "cover" && (
        <div className="space-y-2">
          <label className="block text-xs font-medium">
            Cover image
            <input
              className="mt-2 block w-full text-sm"
              type="file"
              accept="image/*"
              disabled={busy || !userId}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (!file) return;
                if (!allowed) return onUpsell();
                setBusy(true);
                setError("");
                try {
                  onChange({ coverImage: await uploadImage(file, userId) });
                } catch (err) {
                  setError(
                    err instanceof Error ? err.message : "Upload failed",
                  );
                } finally {
                  setBusy(false);
                }
              }}
            />
          </label>
          {busy && <p role="status">Uploading…</p>}
          {design.coverImage && (
            <button
              type="button"
              className="text-xs underline"
              onClick={() => onChange({ coverImage: undefined })}
            >
              Remove cover
            </button>
          )}
          {error && (
            <p role="alert" className="text-xs text-danger">
              {error}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
