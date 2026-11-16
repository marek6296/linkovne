/** Crop coordinates in source pixels. The viewport is always fully covered. */
export function cropRect(
  width: number,
  height: number,
  aspect: number,
  zoom: number,
  x: number,
  y: number,
) {
  const ratio = Number.isFinite(aspect) && aspect > 0 ? aspect : width / height;
  const scale = Math.max(1, Math.min(4, zoom));
  const w = Math.min(width, height * ratio) / scale;
  const h = w / ratio;
  return {
    x: (width - w) * Math.max(0, Math.min(1, x)),
    y: (height - h) * Math.max(0, Math.min(1, y)),
    width: w,
    height: h,
  };
}
