"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Kbd } from "@/components/ui/kbd";
import { useHotkey } from "@/hooks/use-hotkeys";
import { shortcuts, type ShortcutDefinition } from "@/lib/shortcuts";
import { useUiStore } from "@/store/ui-store";

const scopes: ShortcutDefinition["scope"][] = [
  "Global",
  "Typography",
  "Colors",
  "Icons",
  "Backgrounds",
  "Mockups",
  "Social",
];

export function ShortcutsDialog() {
  const open = useUiStore((state) => state.shortcutsOpen);
  const setOpen = useUiStore((state) => state.setShortcutsOpen);
  useHotkey("shift+?", () => setOpen(!open));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Keyboard shortcuts</DialogTitle>
          <DialogDescription>DesignHub is built to be driven from the keyboard.</DialogDescription>
        </DialogHeader>
        <div className="flex max-h-[60vh] flex-col gap-4 overflow-y-auto scrollbar-thin">
          {scopes.map((scope) => {
            const items = shortcuts.filter((item) => item.scope === scope);
            if (items.length === 0) return null;
            return (
              <section key={scope} className="flex flex-col gap-1">
                <h3 className="text-[11px] font-medium uppercase tracking-[0.12em] text-subtle-foreground">{scope}</h3>
                <dl className="flex flex-col">
                  {items.map((item) => (
                    <div key={item.description} className="flex h-8 items-center justify-between gap-4 text-sm">
                      <dt className="text-muted-foreground">{item.description}</dt>
                      <dd className="flex items-center gap-1">
                        {item.keys.map((key) => (
                          <Kbd key={key}>{key}</Kbd>
                        ))}
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
