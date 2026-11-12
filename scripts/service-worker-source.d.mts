export const RUNTIME_RECORD_PATH: string;

export function serviceWorkerSource(options: {
  buildId: string;
  shell: string[];
  routeFiles: Record<string, string[]>;
  runtimeLimit?: number;
  runtimeBytes?: number;
}): string;
