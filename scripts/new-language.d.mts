export function validCode(code: string): boolean;
export function defaultName(code: string): string;
export function newFiles(code: string, areas: readonly string[]): Record<string, string>;
export function patchLocales(source: string, code: string, name: string): string;
export function patchCatalogs(source: string, code: string, areas: readonly string[]): string;
export function patchArea(source: string, code: string, area: string): string;
export function patchInProgress(source: string, code: string): string;
