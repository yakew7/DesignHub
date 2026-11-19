export type Advisory = { name: string; severity: string; title: string; range: string; url: string };
export function advisoriesOf(report: unknown): Advisory[];
export function failing(list: Advisory[]): Advisory[];
export function summary(list: Advisory[]): string;
