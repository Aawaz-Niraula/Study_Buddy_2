"use client";

import imageCompression from "browser-image-compression";

/** Groq vision payload limit per image — stay safely under 4MB. */
const MAX_OUTPUT_BYTES = 4 * 1024 * 1024;
const TARGET_MAX_MB = 3.85;
const MAX_WIDTH = 2048;

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

  if (out.size > MAX_OUTPUT_BYTES) {
    out = await imageCompression(out, {
      maxSizeMB: 3.5,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
      fileType: "image/jpeg",
      onProgress: (percent: number) => notify(50 + percent / 2),
    });
  }

  if (out.size > MAX_OUTPUT_BYTES) {
    throw new Error(
      "Could not compress image under 4MB. Try a smaller or lower-resolution photo."
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
    reader.onload = () =>
      typeof reader.result === "string"
        ? resolve(reader.result)
        : reject(new Error("Could not read image file."));
    reader.onerror = () => reject(new Error("Could not read image file."));
    reader.readAsDataURL(file);
  });
}
