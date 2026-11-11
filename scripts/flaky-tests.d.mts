export type RetriedTest = { title: string; file: string; attempts: number };
export function retriedTests(report: unknown): RetriedTest[];
export function summary(found: RetriedTest[]): string;
export type FailedRuns = { title: string; file: string; failed: number; runs: number };
export function failedRuns(report: unknown): FailedRuns[];
export function repeatSummary(found: FailedRuns[]): string;
export type TestDuration = { title: string; file: string; duration: number };
export function testDurations(report: unknown): TestDuration[];
export function slowestSummary(durations: TestDuration[], count?: number): string;
