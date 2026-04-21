"use client";

import * as React from "react";
import { Moon, SunMedium } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      aria-label={isDark ? "Przełącz na jasny motyw" : "Przełącz na ciemny motyw"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="rounded-full border-border/60 bg-background/70"
    >
      {isDark ? <SunMedium /> : <Moon />}
    </Button>
  );
}
