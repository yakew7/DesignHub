import { withPngCredit } from "@/lib/export/credit";
import { svgToDataUrl } from "@/lib/icons/svg";

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not rasterize SVG"));
    image.src = src;
  });
}

/** Rasterizes an SVG string into a PNG (square unless `height` is given). */
export async function svgToPngBlob(
  svg: string,
  size: number,
  height = size,
  type: "image/png" | "image/jpeg" = "image/png",
): Promise<Blob> {
  const image = await loadImage(svgToDataUrl(svg));
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas is not available");
  context.imageSmoothingQuality = "high";
  if (type === "image/jpeg") {
    // JPEG has no alpha; paint white so transparent areas don't turn black.
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, size, height);
  }
  context.drawImage(image, 0, 0, size, height);
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((result) => (result ? resolve(result) : reject(new Error("Image encoding failed"))), type, 0.92),
  );
  if (type !== "image/png") return blob;
  // Every PNG DesignHub exports carries a "Made with DesignHub" note in its metadata.
  const credited = withPngCredit(new Uint8Array(await blob.arrayBuffer()));
  return new Blob([credited.slice().buffer], { type: "image/png" });
}

export async function svgToPngBytes(svg: string, size: number): Promise<Uint8Array> {
  const blob = await svgToPngBlob(svg, size);
  return new Uint8Array(await blob.arrayBuffer());
}
