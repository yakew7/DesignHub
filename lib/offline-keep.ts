/** The part of `navigator.serviceWorker` this uses, so a test can stand in for it. */
export type WorkerLink = {
  controller: { postMessage: (message: unknown) => void } | null;
  addEventListener: (type: "message", listener: (event: { data: unknown }) => void) => void;
  removeEventListener: (type: "message", listener: (event: { data: unknown }) => void) => void;
};

export type KeepResult = { kept: string[]; failed: string[] };

type Reply = { type: "ROUTE_REMEMBERED"; pathname: string; kept: boolean };
const isReply = (data: unknown): data is Reply =>
  typeof data === "object" && data !== null && (data as Reply).type === "ROUTE_REMEMBERED";

/**
 * Asks the worker to keep studios now, one at a time (so each can be reported as it finishes), and waits for its
 * answer to each. A studio the worker cannot fetch, or one that does not answer in time, is reported as failed.
 */
export async function keepStudios(
  pathnames: readonly string[],
  link: WorkerLink,
  onProgress?: (done: number, total: number) => void,
  timeoutMs = 30_000,
): Promise<KeepResult> {
  const result: KeepResult = { kept: [], failed: [] };
  if (!link.controller) return { kept: [], failed: [...pathnames] };
  for (const [index, pathname] of pathnames.entries()) {
    const kept = await new Promise<boolean>((resolve) => {
      const finish = (value: boolean) => {
        clearTimeout(timer);
        link.removeEventListener("message", listen);
        resolve(value);
      };
      const listen = (event: { data: unknown }) => {
        if (isReply(event.data) && event.data.pathname === pathname) finish(event.data.kept);
      };
      const timer = setTimeout(() => finish(false), timeoutMs);
      link.addEventListener("message", listen);
      link.controller?.postMessage({ type: "REMEMBER_ROUTE", pathname });
    });
    (kept ? result.kept : result.failed).push(pathname);
    onProgress?.(index + 1, pathnames.length);
  }
  return result;
}
