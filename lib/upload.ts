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

export async function uploadImage(file: File, userId: string): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Only image files are allowed.");
  }

  if (file.size > 15 * 1024 * 1024)
    throw new Error("Image is too big — keep it under 15 MB.");
  let blob: Blob;
  try {
    blob = await compress(file);
  } catch {
    throw new Error("Couldn't read this image. Try a JPG, PNG or WebP file.");
  }
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
