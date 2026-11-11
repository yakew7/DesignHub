"use client";

import { KeyRound, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "@/lib/toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AI_KEY_STORAGE_NAME,
  cleanAiKey,
  cleanBaseUrl,
  cleanModelName,
  isLocalBaseUrl,
  loadAiKey,
  OPENAI_KEY_STORAGE_NAME,
  removeAiKey,
  saveAiKey,
  type StoredAiKey,
} from "@/lib/brand-dna/ai-key";
import { AI_API_NAME, AI_MODEL, aiRequestPreview } from "@/lib/brand-dna/providers/anthropic";
import { sampleToPngBase64 } from "@/lib/brand-dna/providers/encode";
import {
  DEFAULT_OPENAI_BASE_URL,
  OPENAI_API_NAME,
  openAiRequestPreview,
} from "@/lib/brand-dna/providers/openai-compatible";
import type { DnaImage } from "@/lib/brand-dna/types";

export type AiPanelProvider = "anthropic" | "openai-compatible";

/** What differs between the two providers that bring a key: where it is kept, who answers and which fields exist. */
const PROVIDERS = {
  anthropic: { storage: AI_KEY_STORAGE_NAME, api: AI_API_NAME, host: "api.anthropic.com", endpointField: false },
  "openai-compatible": {
    storage: OPENAI_KEY_STORAGE_NAME,
    api: OPENAI_API_NAME,
    host: "",
    endpointField: true,
  },
} as const;

/**
 * The connection and the consent for an AI provider. The key is saved only in this browser's IndexedDB,
 * and the exact images, instructions, model and destination are shown before the first request is allowed.
 */
export function AiKeyPanel({
  provider,
  images,
  onChange,
}: {
  provider: AiPanelProvider;
  images: DnaImage[];
  onChange: () => void;
}) {
  const config = PROVIDERS[provider];
  const [stored, setStored] = useState<StoredAiKey | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [draftKey, setDraftKey] = useState("");
  const [draftModel, setDraftModel] = useState("");
  const [draftUrl, setDraftUrl] = useState(DEFAULT_OPENAI_BASE_URL);
  const [editModel, setEditModel] = useState("");

  useEffect(() => {
    let active = true;
    setLoaded(false);
    void loadAiKey(config.storage).then((value) => {
      if (!active) return;
      setStored(value);
      setEditModel(value?.model ?? "");
      setLoaded(true);
    });
    return () => {
      active = false;
    };
  }, [config.storage]);

  // Exactly what the request carries: the downscaled PNGs, the instructions, the model and the destination.
  const preview = useMemo(() => {
    if (!stored || images.length === 0) return null;
    try {
      if (provider === "anthropic") {
        return { ...aiRequestPreview(images, sampleToPngBase64, stored.model || AI_MODEL), host: config.host };
      }
      return openAiRequestPreview(images, sampleToPngBase64, stored);
    } catch {
      return null;
    }
  }, [stored, images, provider, config.host]);

  async function save() {
    const baseUrl = config.endpointField ? (cleanBaseUrl(draftUrl) ?? undefined) : undefined;
    if (config.endpointField && !baseUrl) {
      toast.error("That endpoint can't be used.", {
        description: "Use an https address, or http on this device (localhost). No credentials, query or fragment.",
      });
      return;
    }
    const local = isLocalBaseUrl(baseUrl);
    const key = draftKey.trim() ? cleanAiKey(draftKey) : local ? "" : null;
    if (key === null) {
      toast.error("That doesn't look like an API key.", { description: "Paste it without spaces or line breaks." });
      return;
    }
    const model = draftModel.trim() ? cleanModelName(draftModel) : config.endpointField ? null : undefined;
    if (model === null) {
      toast.error("That doesn't look like a model name.", { description: "Use letters, digits and . : / @ _ -" });
      return;
    }
    const value: StoredAiKey = { key, reviewed: false, ...(model ? { model } : {}), ...(baseUrl ? { baseUrl } : {}) };
    await saveAiKey(value, config.storage);
    setStored(value);
    setEditModel(value.model ?? "");
    setDraftKey("");
    toast.success("Saved in this browser");
  }

  async function remove() {
    await removeAiKey(config.storage);
    setStored(null);
    setEditModel("");
    toast.success("Removed", { description: "The connection and your review were deleted from this browser." });
    onChange();
  }

  async function approve() {
    if (!stored) return;
    const value = { ...stored, reviewed: true };
    await saveAiKey(value, config.storage);
    setStored(value);
    onChange();
  }

  /** Changing the model changes what is sent, so the review starts again. */
  async function changeModel() {
    if (!stored) return;
    const model = editModel.trim() ? cleanModelName(editModel) : undefined;
    if (model === null || (config.endpointField && !model)) {
      toast.error("That doesn't look like a model name.", { description: "Use letters, digits and . : / @ _ -" });
      return;
    }
    const value: StoredAiKey = { key: stored.key, reviewed: false, ...(model ? { model } : {}) };
    if (stored.baseUrl) value.baseUrl = stored.baseUrl;
    await saveAiKey(value, config.storage);
    setStored(value);
  }

  if (!loaded) return null;
  const modelChanged = (stored?.model ?? "") !== editModel.trim();
  return (
    <div className="flex flex-col gap-3 rounded-md border p-3 text-xs">
      <p className="text-muted-foreground">
        Uses the {config.api}. Your key stays in this browser (IndexedDB). It is never added to exports, project files
        or share links, and is sent only to the provider you chose.
      </p>
      {stored ? (
        <>
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2 font-medium">
              <KeyRound className="size-3.5" />
              {stored.key ? `Key saved (ends in ${stored.key.slice(-4)})` : "Saved (no key, local server)"}
            </span>
            <Button variant="outline" size="sm" onClick={() => void remove()}>
              <Trash2 /> Remove key
            </Button>
          </div>
          <div className="flex items-end gap-2">
            <div className="flex flex-1 flex-col gap-1">
              <Label htmlFor={`ai-model-${provider}`}>Model</Label>
              <Input
                id={`ai-model-${provider}`}
                value={editModel}
                placeholder={provider === "anthropic" ? AI_MODEL : "Model name"}
                autoComplete="off"
                spellCheck={false}
                onChange={(event) => setEditModel(event.target.value)}
              />
            </div>
            <Button variant="outline" size="sm" disabled={!modelChanged} onClick={() => void changeModel()}>
              Change model
            </Button>
          </div>
          {stored.reviewed ? (
            <p className="text-muted-foreground">You have reviewed what is sent. Removing the key resets that.</p>
          ) : (
            <div className="flex flex-col gap-2" role="group" aria-label="What will be sent">
              <p className="font-medium">Before the first request, this is exactly what is sent:</p>
              {preview ? (
                <>
                  <ul className="flex flex-wrap gap-2">
                    {preview.images.map((item, index) => (
                      <li key={index} className="size-16 overflow-hidden rounded border bg-checker">
                        {/* eslint-disable-next-line @next/next/no-img-element -- the downscaled copy that is sent */}
                        <img
                          src={`data:image/png;base64,${item.base64}`}
                          alt={`Downscaled copy of ${item.name}, as sent`}
                          className="size-full object-contain"
                        />
                      </li>
                    ))}
                  </ul>
                  <p className="text-muted-foreground">
                    Instructions: {preview.prompt} Model: {preview.model}. Sent to: {preview.host}. File names are not
                    sent.
                  </p>
                  <Button size="sm" onClick={() => void approve()}>
                    Send these images when I analyze
                  </Button>
                </>
              ) : (
                <p className="text-muted-foreground">Upload an image to see what would be sent.</p>
              )}
              <p className="text-muted-foreground">
                Until you agree, the on-device result is shown and nothing is sent.
              </p>
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col gap-2">
          {config.endpointField ? (
            <>
              <Label htmlFor="ai-endpoint">Endpoint</Label>
              <Input
                id="ai-endpoint"
                value={draftUrl}
                autoComplete="off"
                spellCheck={false}
                placeholder={DEFAULT_OPENAI_BASE_URL}
                onChange={(event) => setDraftUrl(event.target.value)}
              />
              <p className="text-muted-foreground">
                A local server such as Ollama works too: http://localhost:11434/v1 needs no key.
              </p>
            </>
          ) : null}
          <Label htmlFor="ai-draft-model">{config.endpointField ? "Model" : "Model (optional)"}</Label>
          <Input
            id="ai-draft-model"
            value={draftModel}
            autoComplete="off"
            spellCheck={false}
            placeholder={provider === "anthropic" ? AI_MODEL : "Model name"}
            onChange={(event) => setDraftModel(event.target.value)}
          />
          <Label htmlFor="ai-key">API key</Label>
          <Input
            id="ai-key"
            type="password"
            autoComplete="off"
            spellCheck={false}
            value={draftKey}
            placeholder="Paste your key"
            onChange={(event) => setDraftKey(event.target.value)}
          />
          <Button
            size="sm"
            onClick={() => void save()}
            disabled={config.endpointField ? !draftModel.trim() : !draftKey.trim()}
          >
            Save key in this browser
          </Button>
        </div>
      )}
    </div>
  );
}
