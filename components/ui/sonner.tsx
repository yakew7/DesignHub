"use client";

import { useTheme } from "next-themes";
import { useEffect } from "react";
import { Toaster as Sonner, type ToasterProps } from "sonner";

import { toasterReady } from "@/lib/toast";

function Toaster(props: ToasterProps) {
  const { resolvedTheme } = useTheme();
  // Sonner subscribes in its own effect, which runs before this one: queued toasts can be shown now.
  useEffect(() => void toasterReady(), []);

  return (
    <Sonner
      theme={resolvedTheme === "light" ? "light" : "dark"}
      position="bottom-center"
      duration={2400}
      toastOptions={{
        classNames: {
          toast: "!rounded-lg !border !border-border !bg-popover !text-popover-foreground !shadow-lg !text-sm",
          description: "!text-muted-foreground",
        },
      }}
      {...props}
    />
  );
}

export { Toaster };
