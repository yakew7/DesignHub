import type { DnaImage } from "@/lib/brand-dna/types";
import { createId } from "@/lib/id";

const SAMPLE = 160;
export const MAX_IMAGE_BYTES = 10_000_000;
export const ACCEPTED_IMAGES = ["image/png", "image/jpeg", "image/webp", "image/gif", "image/svg+xml", "image/avif"];

/** Decodes an image file in the browser and keeps a small copy of its pixels. */
export async function loadDnaImage(file: File): Promise<DnaImage> {
  if (!ACCEPTED_IMAGES.includes(file.type)) throw new Error("Use a PNG, JPEG, WebP, GIF, AVIF or SVG image.");
  if (file.size > MAX_IMAGE_BYTES) throw new Error("That image is over 10 MB.");
  const url = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("This browser couldn't read that image."));
      img.src = url;
    });
    const width = image.naturalWidth || SAMPLE;
    const height = image.naturalHeight || SAMPLE;
    const scale = Math.min(1, SAMPLE / Math.max(width, height));
    const sampleWidth = Math.max(1, Math.round(width * scale));
    const sampleHeight = Math.max(1, Math.round(height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = sampleWidth;
    canvas.height = sampleHeight;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error("Canvas is not available.");
    context.drawImage(image, 0, 0, sampleWidth, sampleHeight);
    const pixels = context.getImageData(0, 0, sampleWidth, sampleHeight).data;
    return { id: createId("dna"), name: file.name, url, width, height, pixels, sampleWidth, sampleHeight };
  } catch (error) {
    URL.revokeObjectURL(url);
    throw error;
  }
}
