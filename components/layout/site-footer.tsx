import Link from "next/link";

import { Logo } from "@/components/layout/logo";
import { Message } from "@/components/layout/message";
import { studios } from "@/lib/navigation";
import type { PlainMessageKey } from "@/lib/i18n/translate";
import { siteConfig } from "@/lib/site";

const projectLinks: { label: PlainMessageKey; href: string }[] = [
  { label: "nav.github", href: siteConfig.github },
  { label: "nav.roadmap", href: `${siteConfig.github}/blob/main/ROADMAP.md` },
  { label: "nav.changelog", href: `${siteConfig.github}/blob/main/CHANGELOG.md` },
  { label: "nav.contributing", href: `${siteConfig.github}/blob/main/CONTRIBUTING.md` },
  { label: "nav.security", href: `${siteConfig.github}/blob/main/SECURITY.md` },
];

export function SiteFooter() {
  return (
    <footer className="border-t">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-[2fr_1fr_1fr]">
        <div className="flex flex-col gap-3">
          <Logo />
          <p className="max-w-xs text-sm text-muted-foreground">{siteConfig.tagline}</p>
        </div>
        <nav aria-labelledby="footer-studios" className="flex flex-col gap-2 text-sm">
          <h2 id="footer-studios" className="font-sans text-xs font-medium text-subtle-foreground">
            <Message id="nav.studios" />
          </h2>
          {studios.map((studio) => (
            <Link key={studio.id} href={studio.href} className="w-fit text-muted-foreground hover:text-foreground">
              <Message id={`studio.${studio.id}.title`} />
            </Link>
          ))}
        </nav>
        <nav aria-labelledby="footer-project" className="flex flex-col gap-2 text-sm">
          <h2 id="footer-project" className="font-sans text-xs font-medium text-subtle-foreground">
            <Message id="nav.project" />
          </h2>
          {projectLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noreferrer"
              className="w-fit text-muted-foreground hover:text-foreground"
            >
              <Message id={link.label} />
            </a>
          ))}
        </nav>
      </div>
      <div className="border-t">
        <p className="mx-auto max-w-6xl px-4 py-6 text-xs text-subtle-foreground">
          © {new Date().getFullYear()} DesignHub contributors · Released under the MIT License · Made for designers, by
          designers.
        </p>
      </div>
    </footer>
  );
}
