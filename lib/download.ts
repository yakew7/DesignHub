/** Triggers a browser download for in-memory content. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  // Give the browser a tick to start the download before revoking.
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const mimeTypes: Record<string, string> = {
  css: "text/css",
  scss: "text/x-scss",
  json: "application/json",
  js: "text/javascript",
  ts: "text/typescript",
  tsx: "text/typescript",
  svg: "image/svg+xml",
  html: "text/html",
  txt: "text/plain",
  md: "text/markdown",
};

export function downloadText(content: string, filename: string): void {
  const extension = filename.split(".").pop() ?? "txt";
  downloadBlob(new Blob([content], { type: `${mimeTypes[extension] ?? "text/plain"};charset=utf-8` }), filename);
}

export function downloadDataUrl(dataUrl: string, filename: string): void {
  const anchor = document.createElement("a");
  anchor.href = dataUrl;
  anchor.download = filename;
  anchor.click();
}
