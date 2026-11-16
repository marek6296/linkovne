import { createClient } from "@/lib/supabase/client";

const BUCKET = "linkove-media";
const MAX_EDGE = 1200;
const MAX_VIDEO_BYTES = 30 * 1024 * 1024; // 30 MB — staci na kratke klipy, drzi stranky rychle

/** Zmensi a prekoduje obrazok v prehliadaci — setri Storage aj data navstevnikov. */
async function compress(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    throw new Error("Image processing unavailable.");
  }
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();

  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error("Image conversion failed.")),
      /png|webp|svg/.test(file.type) ? "image/webp" : "image/jpeg",
      0.85,
    ),
  );
}

export async function uploadImage(file: File, userId: string, options: { aspect?: number; originalUrl?: string } = {}): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Only image files are allowed.");
  }

  if (file.size > 15 * 1024 * 1024)
    throw new Error("Image is too big — keep it under 15 MB.");
  const { cropImage } = await import("@/components/editor/image-crop-dialog");
  const cropped = await cropImage(file, options.aspect);
  const originalUrl = options.originalUrl ?? await storeImage(await compress(file), userId);
  const url = await storeImage(await compress(cropped), userId);
  return `${url}?original=${encodeURIComponent(originalUrl)}`;
}

export async function recropImage(url: string, userId: string, aspect?: number): Promise<string> {
  const parsed = new URL(url, window.location.origin);
  const original = parsed.searchParams.get("original") || parsed.href;
  const response = await fetch(original);
  if (!response.ok) throw new Error("Couldn't load the original photo. Please upload it again.");
  const blob = await response.blob();
  return uploadImage(new File([blob], "original", { type: blob.type }), userId, {aspect, originalUrl: original});
}

async function storeImage(blob: Blob, userId: string): Promise<string> {
  const extension =
    blob.type === "image/webp"
      ? "webp"
      : blob.type === "image/png"
        ? "png"
        : "jpg";
  // Storage RLS pusti zapis len do priecinka pomenovaneho vlastnym uuid
  const path = `${userId}/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}.${extension}`;

  const supabase = createClient();
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, blob, { contentType: blob.type });

  if (error) throw new Error(error.message);

  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`;
}

/** Priama nahrata videa — bez prekodovania (prehliadac na to nema nastroj),
 *  len limit velkosti nech stranka klienta ostane rychla. */
export async function uploadVideo(file: File, userId: string): Promise<string> {
  if (!file.type.startsWith("video/")) {
    throw new Error("Only video files are allowed.");
  }
  if (file.size > MAX_VIDEO_BYTES) {
    throw new Error("Video is too big — keep it under 30 MB.");
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "mp4";
  const path = `${userId}/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}.${ext}`;

  const supabase = createClient();
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type });

  if (error) throw new Error(error.message);

  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`;
}

/** Short decorative clips with a real poster for loading and reduced motion. */
export async function uploadProfileVideo(file: File, userId: string) {
  if (!["video/mp4", "video/webm"].includes(file.type)) throw new Error("Choose an MP4 or WebM video.");
  if (file.size > 10 * 1024 * 1024) throw new Error("Keep profile videos under 10 MB.");
  const objectUrl = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.muted = true; video.playsInline = true; video.preload = "auto";
  try {
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error("Couldn't read this video. Try another MP4.")), 15000);
      video.onerror = () => { clearTimeout(timeout); reject(new Error("Unsupported video encoding. Try an H.264 MP4.")); };
      video.onloadeddata = () => { clearTimeout(timeout); resolve(); };
      video.src = objectUrl;
    });
    if (!Number.isFinite(video.duration) || video.duration > 15 || !video.videoWidth) throw new Error("Choose a video no longer than 15 seconds.");
    const canvas = document.createElement("canvas");
    const scale = Math.min(1,1200 / Math.max(video.videoWidth,video.videoHeight));
    canvas.width = Math.round(video.videoWidth*scale); canvas.height = Math.round(video.videoHeight*scale);
    const ctx = canvas.getContext("2d"); if(!ctx) throw new Error("Video preview unavailable.");
    ctx.drawImage(video,0,0,canvas.width,canvas.height);
    const blob = await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error("Video preview unavailable.")),"image/jpeg",0.85));
    const poster = await storeImage(blob, userId);
    const url = await uploadVideo(new File([file],file.type === "video/mp4" ? "profile.mp4" : "profile.webm",{type:file.type}),userId);
    return {url,poster};
  } finally { video.removeAttribute("src"); video.load(); URL.revokeObjectURL(objectUrl); }
}
