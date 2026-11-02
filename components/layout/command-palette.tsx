"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Home,
  Keyboard,
  Layers,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  SlidersHorizontal,
  SquareCode,
  Sun,
  Trash2,
} from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";

import { FontCommands } from "@/components/layout/font-commands";
import { IconCommands } from "@/components/layout/icon-commands";
import { LanguageCommands } from "@/components/layout/language-commands";
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
import { STUDIO_PANE_EVENT, STUDIO_PREVIEW_ID, type StudioPane } from "@/lib/studio-panes";
import { siteConfig } from "@/lib/site";
import type { RecentCommandId } from "@/lib/command-recents";
import { useModeStore } from "@/store/mode-store";
import { useNavStore } from "@/store/nav-store";
import { useCommandRecentsStore } from "@/store/command-recents-store";
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

  // Whenever the palette opens, the search field takes focus, whatever else the page did meanwhile.
  useEffect(() => {
    if (!open) return;
    let frames = 0;
    let frame = 0;
    const take = () => {
      const input = inputRef.current;
      if (input && document.activeElement !== input) {
        input.focus();
        input.setSelectionRange(input.value.length, input.value.length);
      }
      if ((frames += 1) < 12) frame = requestAnimationFrame(take);
    };
    frame = requestAnimationFrame(take);
    return () => cancelAnimationFrame(frame);
  }, [open]);

  useHotkey("mod+k", () => setOpen(!open), { allowInInputs: true });
  useHotkey("/", () => setOpen(true));

  const recent = useCommandRecentsStore((state) => state.recent);
  const remember = useCommandRecentsStore((state) => state.remember);
  const clearRecent = useCommandRecentsStore((state) => state.clear);
  const mode = useModeStore((state) => state.mode);
  const setMode = useModeStore((state) => state.setMode);
  const requestNewProject = useUiStore((state) => state.requestNewProject);
  const collapsed = useNavStore((state) => state.collapsed);
  const toggleCollapsed = useNavStore((state) => state.toggleCollapsed);
  // With nothing typed the palette is short: recent choices, the studios and three actions. The rest
  // (brand actions, languages, fonts, icons, links) appears as the person types.
  const typed = query.trim().length > 0;

  // What is on this screen decides which of these apply: the sidebar exists only on a desktop studio page, and the
  // panes only on a phone. Read when the palette is open, which re-renders it.
  const onDesktop = open && typeof window !== "undefined" && window.matchMedia("(min-width: 64rem)").matches;
  const hasSidebar = onDesktop && Boolean(document.querySelector("[data-sidebar]"));
  const hasPanes =
    open && typeof window !== "undefined" && !onDesktop && Boolean(document.getElementById(STUDIO_PREVIEW_ID));
  const showPane = (pane: StudioPane) => window.dispatchEvent(new CustomEvent(STUDIO_PANE_EVENT, { detail: pane }));

  function run(action: () => void, id?: RecentCommandId) {
    setOpen(false);
    if (id) remember(id);
    action();
  }

  const newProject = () => {
    requestNewProject();
    router.push("/projects");
  };
  /** What a recent id stands for: its label, icon and what it does. */
  function recentEntry(id: RecentCommandId) {
    if (id.startsWith("studio:")) {
      const studio = studios.find((item) => item.id === id.slice(7));
      if (!studio) return null;
      const Icon = studio.icon;
      return { label: t(`studio.${studio.id}.title`), icon: <Icon />, go: () => router.push(studio.href) };
    }
    if (id === "action:theme") {
      return { label: t(isDark ? "theme.toLight" : "theme.toDark"), icon: isDark ? <Sun /> : <Moon />, go: toggle };
    }
    if (id === "action:shortcuts") {
      return { label: t("command.shortcuts"), icon: <Keyboard />, go: () => setShortcutsOpen(true) };
    }
    return { label: t("command.newProject"), icon: <Plus />, go: newProject };
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        showClose={false}
        className="top-[15vh] max-w-xl translate-y-0 gap-0 overflow-hidden p-0"
        onOpenAutoFocus={(event) => {
          // Radix selects the input's text on focus, which would swallow a handed-off query.
          event.preventDefault();
          const focusInput = () => {
            const input = inputRef.current;
            if (!input) return false;
            input.focus();
            input.setSelectionRange(input.value.length, input.value.length);
            return true;
          };
          // The search field can mount a moment after the dialog does, and the dialog has then left focus nowhere:
          // keys typed straight after Ctrl+K would go to the page. Try again on the next frames until it is there.
          if (focusInput()) return;
          let frames = 0;
          const retry = () => {
            if (!focusInput() && (frames += 1) < 10) requestAnimationFrame(retry);
          };
          requestAnimationFrame(retry);
        }}
      >
        <DialogTitle className="sr-only">{t("command.title")}</DialogTitle>
        <DialogDescription className="sr-only">{t("command.description")}</DialogDescription>
        <Command loop>
          <CommandInput ref={inputRef} value={query} onValueChange={setQuery} placeholder={t("command.placeholder")} />
          <CommandList>
            <CommandEmpty>{t("command.empty", { query })}</CommandEmpty>
            {!typed && recent.length > 0 ? (
              <CommandGroup heading={t("command.group.recent")}>
                {recent.map((id) => {
                  const entry = recentEntry(id);
                  if (!entry) return null;
                  return (
                    <CommandItem key={id} value={`recent ${id} ${entry.label}`} onSelect={() => run(entry.go, id)}>
                      {entry.icon}
                      {entry.label}
                    </CommandItem>
                  );
                })}
                <CommandItem value="recent clear forget" onSelect={() => clearRecent()}>
                  <Trash2 />
                  {t("command.clearRecent")}
                </CommandItem>
              </CommandGroup>
            ) : null}
            {typed && open ? <LanguageCommands query={query} onDone={() => setOpen(false)} /> : null}
            {children}
            {typed && open ? <FontCommands query={query} onDone={() => setOpen(false)} /> : null}
            {typed && open ? <BrandCommands onDone={() => setOpen(false)} /> : null}
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
                    onSelect={() => run(() => router.push(studio.href), `studio:${studio.id}`)}
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
              {!typed ? (
                <CommandItem
                  value={`new brand project ${t("command.newProject")}`}
                  onSelect={() => run(newProject, "action:newProject")}
                >
                  <Plus />
                  {t("command.newProject")}
                </CommandItem>
              ) : null}
              <CommandItem
                value={`toggle theme dark light mode ${t("theme.toggle")}`}
                onSelect={() => run(toggle, "action:theme")}
              >
                {isDark ? <Sun /> : <Moon />}
                {t(isDark ? "theme.toLight" : "theme.toDark")}
                <CommandShortcut>
                  <Kbd>⌥</Kbd>
                  <Kbd>T</Kbd>
                </CommandShortcut>
              </CommandItem>
              {hasSidebar ? (
                <CommandItem
                  value={`sidebar collapse expand rail ${t("nav.collapse")} ${t("nav.expand")}`}
                  onSelect={() => run(toggleCollapsed)}
                >
                  {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
                  {t(collapsed ? "nav.expand" : "nav.collapse")}
                  <CommandShortcut>
                    <Kbd>⌘</Kbd>
                    <Kbd>B</Kbd>
                  </CommandShortcut>
                </CommandItem>
              ) : null}
              {hasPanes
                ? (
                    [
                      ["controls", "command.showControls", SlidersHorizontal],
                      ["preview", "command.showPreview", Layers],
                      ["output", "command.showOutput", SquareCode],
                    ] as const
                  ).map(([pane, key, Icon]) => (
                    <CommandItem
                      key={pane}
                      value={`pane show ${pane} ${t(key)}`}
                      onSelect={() => run(() => showPane(pane))}
                    >
                      <Icon />
                      {t(key)}
                    </CommandItem>
                  ))
                : null}
              <CommandItem
                value={`simple advanced mode controls ${t("mode.simple")} ${t("mode.advanced")}`}
                onSelect={() => run(() => setMode(mode === "advanced" ? "simple" : "advanced"))}
              >
                <SlidersHorizontal />
                {t(mode === "advanced" ? "command.modeSimple" : "command.modeAdvanced")}
              </CommandItem>
              <CommandItem
                value={`keyboard shortcuts help ${t("command.shortcuts")}`}
                onSelect={() => run(() => setShortcutsOpen(true), "action:shortcuts")}
              >
                <Keyboard />
                {t("command.shortcuts")}
                <CommandShortcut>
                  <Kbd>?</Kbd>
                </CommandShortcut>
              </CommandItem>
              {typed ? (
                <>
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
                </>
              ) : null}
            </CommandGroup>
            {/* Last on purpose: its value always contains the whole query, and cmdk keeps groups in
                source order, so anywhere earlier it would be picked over real matches. */}
            {typed && open ? <IconCommands query={query} onDone={() => setOpen(false)} /> : null}
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
