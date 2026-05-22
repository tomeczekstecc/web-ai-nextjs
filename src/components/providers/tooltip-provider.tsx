"use client";

import { TooltipProvider } from "@/components/ui/tooltip";

type AppTooltipProviderProps = {
  children: React.ReactNode;
};

export function AppTooltipProvider({ children }: AppTooltipProviderProps) {
  return <TooltipProvider delay={150}>{children}</TooltipProvider>;
}
