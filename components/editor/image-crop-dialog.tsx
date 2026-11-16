"use client";
import { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { cropRect } from "@/lib/image-crop";

function CropDialog({
  file,
  aspect,
  finish,
}: {
  file: File;
  aspect?: number;
  finish: (file: File | null) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null),
    frame = useRef<HTMLDivElement>(null);
  const [src, setSrc] = useState("");
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [ratio, setRatio] = useState(aspect ?? 0);
  const [zoom, setZoom] = useState(1),
    [point, setPoint] = useState({ x: 0.5, y: 0.5 });
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const image = useRef<HTMLImageElement>(null);
  const drag = useRef<{ x: number; y: number; px: number; py: number } | null>(
    null,
  );
  useEffect(() => {
    const url = URL.createObjectURL(file);
    setSrc(url);
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.current?.showModal();
    return () => {
      URL.revokeObjectURL(url);
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, [file]);
  const actualRatio = ratio || size.w / size.h || 1;
  const crop = cropRect(
    size.w || 1,
    size.h || 1,
    actualRatio,
    zoom,
    point.x,
    point.y,
  );
  function move(dx: number, dy: number) {
    setPoint((p) => ({
      x: Math.max(0, Math.min(1, p.x + dx)),
      y: Math.max(0, Math.min(1, p.y + dy)),
    }));
  }
  async function save() {
    if (!image.current || !size.w || busy) return;
    setBusy(true);
    setError("");
    try {
      const canvas = document.createElement("canvas");
      const scale = Math.min(1, 1600 / Math.max(crop.width, crop.height));
      canvas.width = Math.max(1, Math.round(crop.width * scale));
      canvas.height = Math.max(1, Math.round(crop.height * scale));
      const ctx = canvas.getContext("2d");
      if (!ctx) throw Error("Image editing is unavailable.");
      ctx.drawImage(
        image.current,
        crop.x,
        crop.y,
        crop.width,
        crop.height,
        0,
        0,
        canvas.width,
        canvas.height,
      );
      const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(Error("Could not crop this photo."))),
          "image/webp",
          0.94,
        ),
      );
      finish(new File([blob], "cropped.webp", { type: "image/webp" }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not crop this photo.");
      setBusy(false);
    }
  }
  return (
    <dialog
      ref={dialog}
      className="image-crop-dialog"
      aria-labelledby="crop-title"
      onCancel={(e) => {
        e.preventDefault();
        if (!busy) finish(null);
      }}
    >
      <header>
        <div>
          <h2 id="crop-title">Adjust photo</h2>
          <p>Drag to reposition. Zoom in to choose your crop.</p>
        </div>
        <button
          type="button"
          aria-label="Close crop editor"
          disabled={busy}
          onClick={() => finish(null)}
        >
          ×
        </button>
      </header>
      <div
        ref={frame}
        className="image-crop-frame"
        style={{
          aspectRatio: actualRatio,
          maxHeight: "48dvh",
          width: `min(100%, ${48 * actualRatio}dvh)`,
        }}
        tabIndex={0}
        role="group"
        aria-label="Photo crop. Drag or use arrow keys to reposition."
        onKeyDown={(e) => {
          const step = e.shiftKey ? 0.1 : 0.025;
          if (e.key.startsWith("Arrow")) {
            e.preventDefault();
            move(
              e.key === "ArrowLeft" ? step : e.key === "ArrowRight" ? -step : 0,
              e.key === "ArrowUp" ? step : e.key === "ArrowDown" ? -step : 0,
            );
          }
        }}
        onPointerDown={(e) => {
          if (!size.w) return;
          e.currentTarget.setPointerCapture(e.pointerId);
          drag.current = {
            x: e.clientX,
            y: e.clientY,
            px: point.x,
            py: point.y,
          };
        }}
        onPointerMove={(e) => {
          const d = drag.current;
          if (!d || !frame.current) return;
          const factor = frame.current.clientWidth / crop.width;
          setPoint({
            x: Math.max(
              0,
              Math.min(
                1,
                d.px -
                  (e.clientX - d.x) /
                    Math.max(1, (size.w - crop.width) * factor),
              ),
            ),
            y: Math.max(
              0,
              Math.min(
                1,
                d.py -
                  (e.clientY - d.y) /
                    Math.max(1, (size.h - crop.height) * factor),
              ),
            ),
          });
        }}
        onPointerUp={() => {
          drag.current = null;
        }}
        onPointerCancel={() => {
          drag.current = null;
        }}
      >
        {src && (
          <img
            ref={image}
            src={src}
            alt="Crop preview"
            draggable={false}
            onLoad={(e) =>
              setSize({
                w: e.currentTarget.naturalWidth,
                h: e.currentTarget.naturalHeight,
              })
            }
            onError={() =>
              setError("Couldn't read this image. Try JPG, PNG or WebP.")
            }
            style={{
              position: "absolute",
              maxWidth: "none",
              width: `${(size.w / crop.width) * 100}%`,
              height: `${(size.h / crop.height) * 100}%`,
              left: `${(-crop.x / crop.width) * 100}%`,
              top: `${(-crop.y / crop.height) * 100}%`,
            }}
          />
        )}
        <div className="image-crop-grid" aria-hidden>
          <i />
          <i />
        </div>
      </div>
      {!aspect && (
        <label className="block mt-4 text-sm">
          Crop shape
          <select
            className="field mt-2"
            value={ratio}
            onChange={(e) => {
              setRatio(Number(e.target.value));
              setZoom(1);
              setPoint({ x: 0.5, y: 0.5 });
            }}
          >
            <option value={0}>Original</option>
            <option value={1}>Square · 1:1</option>
            <option value={0.8}>Portrait · 4:5</option>
            <option value={1.7777777777777777}>Wide · 16:9</option>
            <option value={2}>Cover · 2:1</option>
          </select>
        </label>
      )}
      <label className="image-crop-zoom">
        Zoom{" "}
        <input
          aria-label="Photo zoom"
          type="range"
          min={1}
          max={4}
          step={0.01}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
        />
        <span>{zoom.toFixed(1)}×</span>
      </label>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      <footer>
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            setZoom(1);
            setPoint({ x: 0.5, y: 0.5 });
          }}
        >
          Reset
        </button>
        <div>
          <button type="button" disabled={busy} onClick={() => finish(null)}>
            Cancel
          </button>
          <button
            type="button"
            className="btn-ink"
            disabled={busy || !size.w}
            onClick={save}
          >
            {busy ? "Preparing…" : "Use photo"}
          </button>
        </div>
      </footer>
    </dialog>
  );
}
export function cropImage(file: File, aspect?: number): Promise<File> {
  return new Promise((resolve, reject) => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const finish = (result: File | null) => {
      root.unmount();
      host.remove();
      if (result) resolve(result);
      else
        reject(new DOMException("Photo adjustment cancelled.", "AbortError"));
    };
    root.render(<CropDialog file={file} aspect={aspect} finish={finish} />);
  });
}
