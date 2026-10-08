"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { useI18n } from "@/components/layout/locale-provider";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useHotkey } from "@/hooks/use-hotkeys";
import { useMounted } from "@/hooks/use-mounted";

export function useThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme !== "light";
  return { isDark, toggle: () => setTheme(isDark ? "light" : "dark") };
}

export function ThemeToggle() {
  const mounted = useMounted();
  const { isDark, toggle } = useThemeToggle();
  const { t } = useI18n();
  useHotkey("alt+t", toggle);

  const label = mounted ? t(isDark ? "theme.toLight" : "theme.toDark") : t("theme.toggle");

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon" onClick={toggle} aria-label={label}>
          {mounted && !isDark ? <Moon /> : <Sun />}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {label} <span className="ml-1 opacity-60">⌥T</span>
      </TooltipContent>
    </Tooltip>
  );
}
