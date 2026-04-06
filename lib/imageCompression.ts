"use client";

import imageCompression from "browser-image-compression";

/**
 * Groq limits base64 image inputs to about 4MB.
 * Base64 expands binary data, so we keep the compressed file itself closer to 3MB.
 */
const MAX_BASE64_BYTES = 4 * 1024 * 1024;
const MAX_BINARY_BYTES = 3 * 1024 * 1024;
const TARGET_MAX_MB = 2.85;
const MAX_WIDTH = 1600;

export interface CompressionProgress {
  fileName: string;
  progress: number; // 0-100
}

export async function compressImage(
  file: File,
  onProgress?: (p: CompressionProgress) => void
): Promise<File> {
  const notify = (progress: number) =>
    onProgress?.({ fileName: file.name, progress: Math.min(100, Math.round(progress)) });

  if (!file.type.startsWith("image/")) {
    throw new Error("Not an image file.");
  }

  notify(0);

  // Always run through compression so large PNGs/WebPs shrink before the model.
  let out = await imageCompression(file, {
    maxSizeMB: TARGET_MAX_MB,
    maxWidthOrHeight: MAX_WIDTH,
    useWebWorker: true,
    fileType: "image/jpeg",
    onProgress: (percent: number) => notify(percent),
  });

  if (out.size > MAX_BINARY_BYTES) {
    out = await imageCompression(out, {
      maxSizeMB: 2.5,
      maxWidthOrHeight: 1280,
      useWebWorker: true,
      fileType: "image/jpeg",
      onProgress: (percent: number) => notify(50 + percent / 2),
    });
  }

  if (out.size > MAX_BINARY_BYTES) {
    throw new Error(
      "Could not compress image enough for AI processing. Try a smaller or lower-resolution photo."
    );
  }

  notify(100);
  return out;
}

export async function compressImages(
  files: File[],
  onProgress?: (overall: number, current: CompressionProgress) => void
): Promise<File[]> {
  const results: File[] = [];
  for (let i = 0; i < files.length; i++) {
    const compressed = await compressImage(files[i], (p) => {
      const overall = Math.round(((i + p.progress / 100) / files.length) * 100);
      onProgress?.(overall, p);
    });
    results.push(compressed);
  }
  return results;
}

export async function fileToCompressedDataUrl(file: File): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        reject(new Error("Could not read image file."));
        return;
      }

      const [, base64 = ""] = reader.result.split(",", 2);
      const estimatedBytes = Math.ceil((base64.length * 3) / 4);
      if (estimatedBytes > MAX_BASE64_BYTES) {
        reject(
          new Error("Image is still too large for AI processing after compression. Try a smaller photo.")
        );
        return;
      }

      resolve(reader.result);
    };
    reader.onerror = () => reject(new Error("Could not read image file."));
    reader.readAsDataURL(file);
  });
}
