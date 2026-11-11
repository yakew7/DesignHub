"use client";

import type { ExternalToast, toast as SonnerToast } from "sonner";

/**
 * The same calls as sonner's `toast`, without loading sonner until the first toast. A toast raised before the
 * toaster exists waits in a queue and is shown when it is ready, so none is lost. Every toast has an id (made here
 * when the call gives none) so it can be updated or replaced later, as `toast.loading` then `toast.success` do.
 */
type Title = Parameters<typeof SonnerToast>[0];
type Method = "message" | "success" | "error" | "info" | "warning" | "loading";
type Job = { method: Method; title: Title; options: ExternalToast };

const queue: Job[] = [];
let sonner: typeof SonnerToast | null = null;
let started = false;
let counter = 0;
const wanting = new Set<() => void>();

/** Called by the toaster once it is mounted (and subscribed): shows what was waiting, and everything after at once. */
export async function toasterReady() {
  const loaded = (await import("sonner")).toast;
  sonner = loaded;
  for (const job of queue.splice(0)) show(loaded, job);
}

function show(target: typeof SonnerToast, job: Job) {
  if (job.method === "message") target(job.title, job.options);
  else target[job.method](job.title, job.options);
}

/** Asks for the toaster to be mounted (once), the first time a toast is wanted. */
export function onToasterWanted(listener: () => void): () => void {
  wanting.add(listener);
  if (started) listener();
  return () => void wanting.delete(listener);
}

function raise(method: Method, title: Title, options: ExternalToast = {}): string | number {
  const id = options.id ?? `t${(counter += 1)}`;
  const job: Job = { method, title, options: { ...options, id } };
  if (sonner) {
    show(sonner, job);
  } else {
    queue.push(job);
    if (!started) {
      started = true;
      for (const listener of wanting) listener();
    }
  }
  return id;
}

type Toast = ((title: Title, options?: ExternalToast) => string | number) &
  Record<Exclude<Method, "message">, (title: Title, options?: ExternalToast) => string | number>;

export const toast: Toast = Object.assign((title: Title, options?: ExternalToast) => raise("message", title, options), {
  success: (title: Title, options?: ExternalToast) => raise("success", title, options),
  error: (title: Title, options?: ExternalToast) => raise("error", title, options),
  info: (title: Title, options?: ExternalToast) => raise("info", title, options),
  warning: (title: Title, options?: ExternalToast) => raise("warning", title, options),
  loading: (title: Title, options?: ExternalToast) => raise("loading", title, options),
});
