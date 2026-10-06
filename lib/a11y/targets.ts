import type { TouchTarget } from "@/types/a11y";

export type TargetResult = {
  target: TouchTarget;
  /** WCAG 2.5.5 (AAA): at least 44×44 CSS px. */
  aaa: boolean;
  /** WCAG 2.5.8 (AA): at least 24×24, or enough spacing that a 24px circle on its center touches no neighbor. */
  aa: boolean;
  reason: string;
};

const MIN_AA = 24;
const MIN_AAA = 44;

/** Targets are laid out in a row separated by `gap`; spacing is measured between neighbors. */
export function evaluateTargets(targets: TouchTarget[], gap: number): TargetResult[] {
  return targets.map((target, index) => {
    const aaa = target.width >= MIN_AAA && target.height >= MIN_AAA;
    const bigEnough = target.width >= MIN_AA && target.height >= MIN_AA;
    const neighbors = [targets[index - 1], targets[index + 1]].filter((item): item is TouchTarget => Boolean(item));
    // Spacing exception: the 24px circle on this target's center must not intersect a neighbor,
    // nor the 24px circle of a neighbor that is itself undersized.
    const spaced = neighbors.every((neighbor) => {
      const reach = target.width / 2 + gap;
      const neighborUndersized = neighbor.width < MIN_AA || neighbor.height < MIN_AA;
      return neighborUndersized ? reach + neighbor.width / 2 >= MIN_AA : reach >= MIN_AA / 2;
    });
    const aa = bigEnough || spaced;
    const reason = aaa
      ? "Meets 44×44 (AAA)."
      : bigEnough
        ? "Meets 24×24 (AA) but not 44×44 (AAA)."
        : aa
          ? "Smaller than 24×24 but spaced enough (AA spacing exception)."
          : "Too small and too close to its neighbors.";
    return { target, aaa, aa, reason };
  });
}

export function targetsSection(targets: TouchTarget[], gap: number) {
  return {
    gap,
    results: evaluateTargets(targets, gap).map((result) => ({
      label: result.target.label,
      size: `${result.target.width}×${result.target.height}`,
      "WCAG 2.5.8 (AA)": result.aa,
      "WCAG 2.5.5 (AAA)": result.aaa,
      note: result.reason,
    })),
  };
}
