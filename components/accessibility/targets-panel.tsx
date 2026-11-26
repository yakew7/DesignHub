"use client";

import { Plus, Trash2 } from "lucide-react";
import { useMemo } from "react";

import { CheckList } from "@/components/accessibility/check-list";
import { useI18n } from "@/components/layout/locale-provider";
import { Button } from "@/components/ui/button";
import { SliderField } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Panel } from "@/components/ui/panel";
import { createId } from "@/lib/id";
import { evaluateTargets } from "@/lib/a11y/targets";
import { useA11yStore } from "@/store/a11y-store";
import type { TouchTarget } from "@/types/a11y";

export function TargetsPanel() {
  const { t } = useI18n();
  const targets = useA11yStore((state) => state.targets);
  const setTargets = useA11yStore((state) => state.setTargets);
  const gap = useA11yStore((state) => state.targetGap);
  const setGap = useA11yStore((state) => state.setTargetGap);
  const results = useMemo(() => evaluateTargets(targets, gap), [targets, gap]);
  const patch = (id: string, change: Partial<TouchTarget>) =>
    setTargets(targets.map((target) => (target.id === id ? { ...target, ...change } : target)));

  return (
    <Panel title={t("home.hl.touchTargets")} description="WCAG 2.5.8 (AA, 24px + spacing) and 2.5.5 (AAA, 44px).">
      <ul className="flex flex-col gap-2" aria-label={t("a11y.tab.targets")}>
        {targets.map((target) => (
          <li key={target.id} className="grid grid-cols-[1fr_56px_56px_32px] items-center gap-1.5">
            <Input
              value={target.label}
              aria-label={t("a11y.targets.label")}
              onChange={(event) => patch(target.id, { label: event.target.value })}
              className="h-8 text-xs"
            />
            {(["width", "height"] as const).map((key) => (
              <Input
                key={key}
                type="number"
                min={8}
                max={200}
                aria-label={`${target.label} ${key}`}
                value={target[key]}
                onChange={(event) => patch(target.id, { [key]: Math.max(1, Number(event.target.value) || 1) })}
                className="h-8 px-2 font-mono text-xs"
              />
            ))}
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              aria-label={`Remove ${target.label}`}
              disabled={targets.length <= 1}
              onClick={() => setTargets(targets.filter((item) => item.id !== target.id))}
            >
              <Trash2 />
            </Button>
          </li>
        ))}
      </ul>
      <Button
        variant="outline"
        size="sm"
        disabled={targets.length >= 6}
        onClick={() => setTargets([...targets, { id: createId("target"), label: "Icon", width: 24, height: 24 }])}
      >
        <Plus /> {t("a11y.targets.add")}
      </Button>
      <SliderField
        label="Spacing between targets"
        value={gap}
        min={0}
        max={32}
        onChange={setGap}
        format={(v) => `${v}px`}
      />
      <CheckList
        label="Target results"
        items={results.map((result) => ({
          id: result.target.id,
          label: result.target.label,
          value: `${result.target.width}×${result.target.height}`,
          verdict: result.aaa ? "pass" : result.aa ? "warn" : "fail",
          guidance: result.reason,
        }))}
      />
    </Panel>
  );
}
