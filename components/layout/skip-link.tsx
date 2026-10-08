import { Message } from "@/components/layout/message";

export function SkipLink() {
  return (
    <a
      href="#main"
      className="sr-only z-[60] rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
    >
      <Message id="nav.skip" />
    </a>
  );
}
