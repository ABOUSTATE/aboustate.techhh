import { supabase } from "../../lib/supabaseClient.js";

export const BUCKET = "on-media";
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;

export function mediaUrl(path) {
  if (!path) return null;
  if (/^https?:/.test(path)) return path;
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

// Photos are resized in the browser before upload: keeps the free storage
// tier lasting and makes profiles load fast on mobile data.
async function shrinkImage(file, maxSide = 2000, quality = 0.86) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  canvas.getContext("2d").drawImage(bitmap, 0, 0, w, h);
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
  return { blob, width: w, height: h, mime: "image/jpeg", ext: "jpg" };
}

function videoMeta(file) {
  return new Promise((resolve) => {
    const v = document.createElement("video");
    v.preload = "metadata";
    v.onloadedmetadata = () => {
      resolve({ width: v.videoWidth, height: v.videoHeight, duration_s: Math.round(v.duration) });
      URL.revokeObjectURL(v.src);
    };
    v.onerror = () => resolve({});
    v.src = URL.createObjectURL(file);
  });
}

export async function uploadFile(profileId, file, { maxSide } = {}) {
  let body = file;
  let meta = { mime: file.type, bytes: file.size };
  let ext = (file.name.split(".").pop() || "bin").toLowerCase();

  if (file.type.startsWith("image/")) {
    const img = await shrinkImage(file, maxSide);
    body = img.blob;
    ext = img.ext;
    meta = { mime: img.mime, bytes: img.blob.size, width: img.width, height: img.height };
  } else if (file.type.startsWith("video/")) {
    if (file.size > MAX_VIDEO_BYTES) throw new Error("Videos can be up to 50 MB. Try exporting at 1080p.");
    meta = { ...meta, ...(await videoMeta(file)) };
  } else if (!file.type.startsWith("audio/")) {
    throw new Error("That file type isn't supported.");
  }

  const path = `${profileId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, body, {
    contentType: meta.mime,
    cacheControl: "31536000",
  });
  if (error) throw error;
  return { path, ...meta };
}

export async function removeFile(path) {
  if (!path || /^https?:/.test(path)) return;
  await supabase.storage.from(BUCKET).remove([path]);
}
