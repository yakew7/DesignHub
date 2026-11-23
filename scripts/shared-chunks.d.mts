export type SharedChunk = { path: string; raw: number; gzip: number; marks: string[] };
export function sharedChunks(
  stats: { route: string; firstLoadChunkPaths: string[] }[],
  read: (path: string) => string,
): SharedChunk[];
export function table(chunks: SharedChunk[]): string;
