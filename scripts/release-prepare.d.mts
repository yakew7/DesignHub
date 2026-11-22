export function isNewerVersion(candidate: string, current: string): boolean;
export function prepareChangelog(changelog: string, version: string, date: string): string;
export function setPackageVersion(packageJson: string, version: string): string;
export function setSiteVersion(siteTs: string, version: string): string;
export function addRoadmapLine(readme: string, version: string, text: string): string;
