"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { PanelLeft, PanelTop, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { setNavLayoutAction } from "@/app/actions/nav-layout";
import { useCurrentNavLayout } from "@/components/nav-layout-provider";
import type { NavLayoutMode } from "@/lib/api/domains/menu/contract";
import { cn } from "@/lib/utils";

/**
 * Icon button that toggles between "sidebar" and "top-menu" nav layouts.
 *
 * Persists the choice in a cookie (via server action) then calls
 * `router.refresh()` so AppShell re-renders with the new layout — no hard
 * reload, no layout flash.
 *
 * Reads the current layout from `NavLayoutProvider` — must be mounted inside
 * the provider (provided by AppShell).
 */
export function NavLayoutToggle({ className }: { className?: string }) {
  const currentLayout = useCurrentNavLayout();
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const nextMode: NavLayoutMode =
    currentLayout === "sidebar" ? "top-menu" : "sidebar";
  const label =
    currentLayout === "sidebar"
      ? "Przełącz na menu górne"
      : "Przełącz na panel boczny";

  const Icon = isPending
    ? Loader2
    : currentLayout === "sidebar"
      ? PanelTop
      : PanelLeft;

  function handleToggle() {
    startTransition(async () => {
      await setNavLayoutAction(nextMode);
      router.refresh();
    });
  }

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label={label}
            disabled={isPending}
            onClick={handleToggle}
            className={cn(className)}
          >
            <Icon className={cn("size-4", isPending && "animate-spin")} />
          </Button>
        }
      />
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  );
}
