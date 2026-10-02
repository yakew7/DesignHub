"use client";

import { Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Panel } from "@/components/ui/panel";
import { Textarea } from "@/components/ui/textarea";
import { MAX_BRAND_VALUES, useBrandStore } from "@/store/brand-store";
import type { BrandValue } from "@/types/brand";

/** Edits the mission and values in the brand profile; the Mission & Values page reads them from there. */
export function GuidelineMissionPanel() {
  const mission = useBrandStore((state) => state.profile.mission);
  const updateMission = useBrandStore((state) => state.updateMission);

  const setValue = (index: number, patch: Partial<BrandValue>) =>
    updateMission({ values: mission.values.map((value, i) => (i === index ? { ...value, ...patch } : value)) });
  const removeValue = (index: number) => updateMission({ values: mission.values.filter((_, i) => i !== index) });
  const addValue = () => updateMission({ values: [...mission.values, { title: "New value", description: "" }] });

  return (
    <Panel title="Mission & values" description="Saved to the brand profile.">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="mission-statement">Mission statement</Label>
        <Textarea
          id="mission-statement"
          value={mission.statement}
          maxLength={220}
          onChange={(event) => updateMission({ statement: event.target.value })}
          className="min-h-20 text-sm"
        />
      </div>
      {mission.values.map((value, i) => (
        <fieldset key={i} className="flex flex-col gap-1.5">
          <legend className="sr-only">Value {i + 1}</legend>
          <div className="flex items-center gap-2">
            <Label htmlFor={`mission-value-${i}`} className="sr-only">
              Value {i + 1} name
            </Label>
            <Input
              id={`mission-value-${i}`}
              value={value.title}
              maxLength={40}
              placeholder={`Value ${i + 1}`}
              onChange={(event) => setValue(i, { title: event.target.value })}
              className="h-8 text-sm"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => removeValue(i)}
              aria-label={`Remove ${value.title || `value ${i + 1}`}`}
              className="size-8 shrink-0"
            >
              <X />
            </Button>
          </div>
          <Label htmlFor={`mission-value-${i}-description`} className="sr-only">
            Value {i + 1} description
          </Label>
          <Textarea
            id={`mission-value-${i}-description`}
            value={value.description}
            maxLength={160}
            placeholder="One or two short sentences."
            onChange={(event) => setValue(i, { description: event.target.value })}
            className="min-h-14 text-sm"
          />
        </fieldset>
      ))}
      {mission.values.length < MAX_BRAND_VALUES ? (
        <Button variant="outline" size="sm" onClick={addValue}>
          <Plus /> Add value
        </Button>
      ) : null}
    </Panel>
  );
}
