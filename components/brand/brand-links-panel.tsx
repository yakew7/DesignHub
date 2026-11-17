"use client";

import "@/lib/i18n/areas/brand";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { useI18n } from "@/components/layout/locale-provider";
import { Panel } from "@/components/ui/panel";
import { studios, type StudioId } from "@/lib/navigation";

const connected: StudioId[] = ["typography", "colors", "icons", "backgrounds", "effects", "export"];

/** The studios this brand draws from. Edits there show up here instantly. */
export function BrandLinksPanel() {
  const { t } = useI18n();
  return (
    <Panel
      id="brand-links"
      collapsible
      defaultOpen={false}
      title={t("brand.links.title")}
      description={t("brand.links.description")}
    >
      <ul className="flex flex-col gap-1">
        {studios
          .filter((studio) => connected.includes(studio.id))
          .map((studio) => {
            const Icon = studio.icon;
            return (
              <li key={studio.id}>
                <Link
                  href={studio.href}
                  className="flex h-9 items-center gap-2 rounded-md px-2 text-sm text-muted-foreground transition-colors duration-150 hover:bg-accent hover:text-foreground"
                >
                  <Icon className="size-4" aria-hidden />
                  <span className="flex-1">{t(`studio.${studio.id}.title`)}</span>
                  <ArrowUpRight className="size-3.5" aria-hidden />
                </Link>
              </li>
            );
          })}
      </ul>
    </Panel>
  );
}
