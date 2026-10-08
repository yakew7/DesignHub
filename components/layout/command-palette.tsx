"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { BookOpen, Home, Keyboard, Moon, Sun } from "lucide-react";
import { useRef, type ReactNode } from "react";

import { FontCommands } from "@/components/layout/font-commands";
import { IconCommands } from "@/components/layout/icon-commands";
import { GithubIcon } from "@/components/layout/github-icon";
import { useI18n } from "@/components/layout/locale-provider";
import { useThemeToggle } from "@/components/layout/theme-toggle";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Kbd } from "@/components/ui/kbd";
import { useHotkey } from "@/hooks/use-hotkeys";
import { studios } from "@/lib/navigation";
import { siteConfig } from "@/lib/site";
import { useUiStore } from "@/store/ui-store";

// Brand actions read projects and brand stores; load them only when the palette opens.
const BrandCommands = dynamic(() => import("@/components/layout/brand-commands").then((m) => m.BrandCommands), {
  ssr: false,
});

export function CommandPalette({ children }: { children?: ReactNode }) {
  const router = useRouter();
  const open = useUiStore((state) => state.commandOpen);
  const query = useUiStore((state) => state.commandQuery);
  const setOpen = useUiStore((state) => state.setCommandOpen);
  const setQuery = useUiStore((state) => state.setCommandQuery);
  const setShortcutsOpen = useUiStore((state) => state.setShortcutsOpen);
  const { isDark, toggle } = useThemeToggle();
  const { t } = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);

  useHotkey("mod+k", () => setOpen(!open), { allowInInputs: true });
  useHotkey("/", () => setOpen(true));

  function run(action: () => void) {
    setOpen(false);
    action();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        showClose={false}
        className="top-[15vh] max-w-xl translate-y-0 gap-0 overflow-hidden p-0"
        onOpenAutoFocus={(event) => {
          // Radix selects the input's text on focus, which would swallow a handed-off query.
          event.preventDefault();
          const input = inputRef.current;
          if (!input) return;
          input.focus();
          input.setSelectionRange(input.value.length, input.value.length);
        }}
      >
        <DialogTitle className="sr-only">{t("command.title")}</DialogTitle>
        <DialogDescription className="sr-only">{t("command.description")}</DialogDescription>
        <Command loop>
          <CommandInput ref={inputRef} value={query} onValueChange={setQuery} placeholder={t("command.placeholder")} />
          <CommandList>
            <CommandEmpty>{t("command.empty", { query })}</CommandEmpty>
            {children}
            {open ? <FontCommands query={query} onDone={() => setOpen(false)} /> : null}
            {open ? <BrandCommands onDone={() => setOpen(false)} /> : null}
            <CommandGroup heading={t("command.group.studios")}>
              <CommandItem value={`home start ${t("nav.home")}`} onSelect={() => run(() => router.push("/"))}>
                <Home />
                {t("nav.home")}
                <CommandShortcut>
                  <Kbd>G</Kbd>
                  <Kbd>H</Kbd>
                </CommandShortcut>
              </CommandItem>
              {studios.map((studio) => {
                const Icon = studio.icon;
                return (
                  <CommandItem
                    key={studio.id}
                    value={`${studio.title} ${t(`studio.${studio.id}.title`)} ${studio.description}`}
                    onSelect={() => run(() => router.push(studio.href))}
                  >
                    <Icon />
                    {t(`studio.${studio.id}.title`)}
                    <CommandShortcut>
                      <Kbd>G</Kbd>
                      <Kbd>{studio.shortcut.toUpperCase()}</Kbd>
                    </CommandShortcut>
                  </CommandItem>
                );
              })}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading={t("command.group.actions")}>
              <CommandItem value={`toggle theme dark light mode ${t("theme.toggle")}`} onSelect={() => run(toggle)}>
                {isDark ? <Sun /> : <Moon />}
                {t(isDark ? "theme.toLight" : "theme.toDark")}
                <CommandShortcut>
                  <Kbd>⌥</Kbd>
                  <Kbd>T</Kbd>
                </CommandShortcut>
              </CommandItem>
              <CommandItem
                value={`keyboard shortcuts help ${t("command.shortcuts")}`}
                onSelect={() => run(() => setShortcutsOpen(true))}
              >
                <Keyboard />
                {t("command.shortcuts")}
                <CommandShortcut>
                  <Kbd>?</Kbd>
                </CommandShortcut>
              </CommandItem>
              <CommandItem
                value={`github source code star ${t("command.github")}`}
                onSelect={() => run(() => window.open(siteConfig.github, "_blank"))}
              >
                <GithubIcon />
                {t("command.github")}
              </CommandItem>
              <CommandItem
                value={`roadmap future plans ${t("nav.roadmap")}`}
                onSelect={() => run(() => window.open(`${siteConfig.github}/blob/main/ROADMAP.md`, "_blank"))}
              >
                <BookOpen />
                {t("nav.roadmap")}
              </CommandItem>
            </CommandGroup>
            {/* Last on purpose: its value always contains the whole query, and cmdk keeps groups in
                source order, so anywhere earlier it would be picked over real matches. */}
            {open ? <IconCommands query={query} onDone={() => setOpen(false)} /> : null}
          </CommandList>
          <footer className="flex h-10 items-center gap-4 border-t px-4 text-[11px] text-subtle-foreground">
            <span className="flex items-center gap-1">
              <Kbd>↑</Kbd>
              <Kbd>↓</Kbd> {t("command.hint.navigate")}
            </span>
            <span className="flex items-center gap-1">
              <Kbd>↵</Kbd> {t("command.hint.select")}
            </span>
            <span className="flex items-center gap-1">
              <Kbd>esc</Kbd> {t("command.hint.close")}
            </span>
          </footer>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
