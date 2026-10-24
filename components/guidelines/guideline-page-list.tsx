"use client";

import { useMemo, useState } from "react";

import { GuidelineSectionGroup } from "@/components/guidelines/guideline-section-group";
import { guidelinePages } from "@/lib/guidelines/registry";
import { groupPagesBySection, pageNumbers } from "@/lib/guidelines/sections";
import type { GuidelineSection } from "@/lib/guidelines/types";
import { useGuidelinesStore } from "@/store/guidelines-store";

const groups = groupPagesBySection(guidelinePages);

export function GuidelinePageList() {
  const selected = useGuidelinesStore((state) => state.selected);
  const excluded = useGuidelinesStore((state) => state.excluded);
  const select = useGuidelinesStore((state) => state.select);
  const toggle = useGuidelinesStore((state) => state.toggle);
  const setIncluded = useGuidelinesStore((state) => state.setIncluded);
  const [folded, setFolded] = useState<GuidelineSection[]>([]);
  const numbers = useMemo(() => pageNumbers(guidelinePages, excluded), [excluded]);

  return (
    <ul className="flex flex-col gap-2" aria-label="Page sections">
      {groups.map((group) => (
        <GuidelineSectionGroup
          key={group.section}
          group={group}
          excluded={excluded}
          numbers={numbers}
          selected={selected}
          open={!folded.includes(group.section)}
          onOpenChange={(open) =>
            setFolded((current) =>
              open ? current.filter((item) => item !== group.section) : [...current, group.section],
            )
          }
          onSelect={select}
          onTogglePage={toggle}
          onToggleSection={setIncluded}
        />
      ))}
    </ul>
  );
}
