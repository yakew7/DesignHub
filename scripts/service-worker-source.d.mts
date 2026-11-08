export function serviceWorkerSource(options: {
  buildId: string;
  shell: string[];
  routeFiles: Record<string, string[]>;
  runtimeLimit?: number;
  runtimeBytes?: number;
}): string;
