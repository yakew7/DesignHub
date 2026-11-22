import { describe, expect, test } from "vitest";

import {
  addRoadmapLine,
  isNewerVersion,
  prepareChangelog,
  setPackageVersion,
  setSiteVersion,
} from "../../scripts/release-prepare.mjs";

const changelog = `# Changelog

All notable changes to DesignHub are documented in this file.

## Unreleased

### Added

- Next thing

### Fixed

- A fix

## v1.2.0 - 2026-11-08

### Added

- A thing

## v1.0.0

- First
`;

const readme = `## Roadmap

- **1.0.0** - the seventeen studios ✅
- **1.2.0** - the Icon studio in Spanish, French and Hindi ✅
- **2.0.0 (next)** - quality and consolidation
- **After 2.0** - Plugin marketplace
`;

describe("isNewerVersion", () => {
  test("a newer patch, minor and major all count, and equal does not", () => {
    expect(isNewerVersion("1.3.0", "1.2.0")).toBe(true);
    expect(isNewerVersion("1.2.1", "1.2.0")).toBe(true);
    expect(isNewerVersion("2.0.0", "1.2.0")).toBe(true);
    expect(isNewerVersion("1.2.0", "1.2.0")).toBe(false);
    expect(isNewerVersion("1.1.9", "1.2.0")).toBe(false);
  });

  test("accepts the v prefix, and compares numerically, not as text", () => {
    expect(isNewerVersion("v1.3.0", "1.2.0")).toBe(true);
    expect(isNewerVersion("1.10.0", "1.9.0")).toBe(true);
    expect(isNewerVersion("1.9.0", "1.10.0")).toBe(false);
  });

  test("refuses a version that is not three numbers", () => {
    for (const bad of ["1.3", "1.2.3.4", "x", "", "1.2.x"]) {
      expect(() => isNewerVersion(bad, "1.2.0"), bad).toThrow(/semantic version/);
    }
  });
});

describe("prepareChangelog", () => {
  test("renames Unreleased to the new version with the date, and adds an empty one above it", () => {
    const next = prepareChangelog(changelog, "1.3.0", "2026-11-21");

    expect(next).toContain("## Unreleased\n\n### Added\n\n### Fixed\n\n## v1.3.0 - 2026-11-21\n");
    expect(next).toContain("### Added\n\n- Next thing\n\n### Fixed\n\n- A fix\n\n## v1.2.0 - 2026-11-08");
    expect(next).not.toContain("## Unreleased\n\n### Added\n\n- Next thing");
  });

  test("accepts the version with a v, and keeps an Unreleased with no subsections bare", () => {
    const plain = "# Changelog\n\n## Unreleased\n\n- Next thing\n\n## v1.2.0 - 2026-11-08\n\n- A thing\n";
    const next = prepareChangelog(plain, "v1.3.0", "2026-11-21");

    expect(next).toContain("## Unreleased\n\n## v1.3.0 - 2026-11-21\n\n- Next thing\n");
  });

  test("refuses a changelog with no Unreleased heading, and one with nothing under it", () => {
    expect(() =>
      prepareChangelog("# Changelog\n\n## v1.2.0 - 2026-11-08\n\n- A thing\n", "1.3.0", "2026-11-21"),
    ).toThrow(/no `## Unreleased` heading/);
    expect(() =>
      prepareChangelog(
        "# Changelog\n\n## Unreleased\n\n### Added\n\n## v1.2.0 - 2026-11-08\n\n- A thing\n",
        "1.3.0",
        "2026-11-21",
      ),
    ).toThrow(/nothing under `## Unreleased`/);
  });

  test("a repeated subsection heading appears once in the new empty Unreleased", () => {
    const doubled =
      "# Changelog\n\n## Unreleased\n\n### Added\n\n- One\n\n### Fixed\n\n- Two\n\n### Added\n\n- Three\n\n## v1.2.0 - 2026-11-08\n\n- A thing\n";
    const next = prepareChangelog(doubled, "1.3.0", "2026-11-21");

    expect(next).toContain("## Unreleased\n\n### Added\n\n### Fixed\n\n## v1.3.0 - 2026-11-21\n");
    expect(next).toContain("### Added\n\n- One\n\n### Fixed\n\n- Two\n\n### Added\n\n- Three\n");
  });
});

describe("setPackageVersion", () => {
  test("sets the version and keeps the rest of the file, ending with a newline", () => {
    const next = setPackageVersion('{\n  "name": "designhub-app",\n  "version": "1.2.0"\n}\n', "1.3.0");

    expect(next).toBe('{\n  "name": "designhub-app",\n  "version": "1.3.0"\n}\n');
  });

  test("refuses text that is not JSON", () => {
    expect(() => setPackageVersion("not json", "1.3.0")).toThrow(/not valid JSON/);
  });
});

describe("setSiteVersion", () => {
  test("sets the version line and leaves the rest alone", () => {
    const site = 'export const siteConfig = {\n  name: "DesignHub",\n  version: "1.2.0",\n} as const;\n';
    expect(setSiteVersion(site, "1.3.0")).toBe(
      'export const siteConfig = {\n  name: "DesignHub",\n  version: "1.3.0",\n} as const;\n',
    );
  });

  test("refuses a file with no version line", () => {
    expect(() => setSiteVersion('export const siteConfig = {\n  name: "DesignHub",\n};\n', "1.3.0")).toThrow(
      /no `version: "..."` line/,
    );
  });
});

describe("addRoadmapLine", () => {
  test("inserts the new release before the (next) line, in version order", () => {
    const next = addRoadmapLine(readme, "1.3.0", "the Icon studio in Spanish, French and Hindi");

    expect(next).toContain(
      "- **1.2.0** - the Icon studio in Spanish, French and Hindi ✅\n" +
        "- **1.3.0** - the Icon studio in Spanish, French and Hindi ✅\n" +
        "- **2.0.0 (next)** - quality and consolidation\n",
    );
  });

  test("inserts an older release before the newer released lines", () => {
    const next = addRoadmapLine(readme, "1.1.0", "an earlier release");

    expect(next).toContain(
      "- **1.0.0** - the seventeen studios ✅\n" +
        "- **1.1.0** - an earlier release ✅\n" +
        "- **1.2.0** - the Icon studio in Spanish, French and Hindi ✅\n",
    );
  });

  test("refuses a line for a version that is already there, and a README with no roadmap lines", () => {
    expect(() => addRoadmapLine(readme, "1.2.0", "again")).toThrow(/already has a roadmap line/);
    expect(() => addRoadmapLine(readme, "v1.2.0", "again")).toThrow(/already has a roadmap line/);
    expect(() => addRoadmapLine("## Roadmap\n\nNothing here yet.\n", "1.3.0", "text")).toThrow(
      /no roadmap release lines/,
    );
  });
});
