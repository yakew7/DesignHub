import { describe, expect, test } from "vitest";

import { sectionFor } from "../../scripts/release-notes.mjs";

const changelog = `# Changelog

## Unreleased

### Added

- Next thing

## v1.2.0 - 2026-11-08

### Added

- A thing

### Fixed

- A fix

## v1.0.0

- First
`;

describe("sectionFor", () => {
  test("returns the section of a tag with a dated heading, up to the next release, without its own heading", () => {
    expect(sectionFor(changelog, "v1.2.0")).toBe("### Added\n\n- A thing\n\n### Fixed\n\n- A fix\n");
  });

  test("accepts the tag without the v, and the last section", () => {
    expect(sectionFor(changelog, "1.0.0")).toBe("- First\n");
  });

  test("does not match another version that starts the same way", () => {
    expect(sectionFor(changelog, "v1.2")).toBeNull();
    expect(sectionFor(changelog, "v1.2.00")).toBeNull();
  });

  test("returns null for a missing or empty section", () => {
    expect(sectionFor(changelog, "v9.9.9")).toBeNull();
    expect(sectionFor("## v2.0.0\n\n## v1.0.0\n- x\n", "v2.0.0")).toBeNull();
  });
});
