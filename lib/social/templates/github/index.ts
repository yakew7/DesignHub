import { githubAurora } from "@/lib/social/templates/github/aurora";
import { githubBento } from "@/lib/social/templates/github/bento";
import { githubEditorial } from "@/lib/social/templates/github/editorial";
import { githubGlass } from "@/lib/social/templates/github/glass";
import { githubGradient } from "@/lib/social/templates/github/gradient";
import { githubGrid } from "@/lib/social/templates/github/grid";
import { githubMinimal } from "@/lib/social/templates/github/minimal";
import { githubSpotlight } from "@/lib/social/templates/github/spotlight";
import { githubSplit } from "@/lib/social/templates/github/split";
import { githubTerminal } from "@/lib/social/templates/github/terminal";
import type { SocialTemplate } from "@/lib/social/types";

/** Every style of the GitHub repository banner, in picker order. Add a style by adding a file here. */
export const githubBannerStyles: SocialTemplate[] = [
  githubMinimal,
  githubEditorial,
  githubAurora,
  githubGrid,
  githubTerminal,
  githubGlass,
  githubGradient,
  githubSplit,
  githubBento,
  githubSpotlight,
];
