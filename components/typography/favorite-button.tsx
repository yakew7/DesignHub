"use client";

import { Heart } from "lucide-react";

import { cn } from "@/lib/utils";
import { useLibraryStore } from "@/store/library-store";

export function FavoriteFontButton({
  family,
  className,
  tabIndex,
}: {
  family: string;
  className?: string;
  /** -1 inside the font listbox, where S toggles the highlighted font instead. */
  tabIndex?: number;
}) {
  const favorite = useLibraryStore((state) => state.favoriteFonts.includes(family));
  const toggleFavoriteFont = useLibraryStore((state) => state.toggleFavoriteFont);

  return (
    <button
      type="button"
      tabIndex={tabIndex}
      onClick={() => toggleFavoriteFont(family)}
      aria-pressed={favorite}
      aria-label={favorite ? `Remove ${family} from favorites` : `Add ${family} to favorites`}
      className={cn(
        "flex size-8 items-center justify-center rounded-md text-subtle-foreground transition-colors duration-150 hover:bg-accent hover:text-foreground",
        favorite && "text-destructive hover:text-destructive",
        className,
      )}
    >
      <Heart className={cn("size-4", favorite && "fill-current")} aria-hidden />
    </button>
  );
}
