export function withoutComments(source: string): string;
export function neededAreas(source: string, keysByArea: Record<string, Set<string>>): Set<string>;
export function importedAreas(source: string): Set<string>;
export function localImports(file: string, source: string): string[];
export function findMissingImports(
  files: Map<string, string>,
  keysByArea: Record<string, Set<string>>,
): { file: string; area: string }[];
