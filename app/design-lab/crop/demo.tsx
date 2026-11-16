"use client";
import { useEffect, useState } from "react";
import { cropImage } from "@/components/editor/image-crop-dialog";
export default function Demo() {
  const [url, setUrl] = useState(""),
    [message, setMessage] = useState("");
  useEffect(
    () => () => {
      if (url) URL.revokeObjectURL(url);
    },
    [url],
  );
  return (
    <main className="mx-auto max-w-lg p-6">
      <h1 className="text-2xl font-semibold">Crop preview</h1>
      <p className="my-4">
        Local only — nothing is uploaded or saved to a profile.
      </p>
      <button
        className="btn-ink"
        onClick={async () => {
          try {
            const blob = await (
              await fetch("/templates/cobalt-glass.webp")
            ).blob();
            const result = await cropImage(
              new File([blob], "demo.webp", { type: blob.type }),
              2,
            );
            setUrl(URL.createObjectURL(result));
            setMessage("Crop applied locally");
          } catch (e) {
            setMessage(
              e instanceof Error && e.name === "AbortError"
                ? "Cancelled — original preserved"
                : "Could not open image",
            );
          }
        }}
      >
        Adjust sample cover
      </button>
      {message && (
        <p role="status" className="my-4">
          {message}
        </p>
      )}
      {url && (
        <img
          src={url}
          alt="Cropped cover result"
          className="mt-4 aspect-[2/1] w-full rounded-2xl"
        />
      )}
    </main>
  );
}
