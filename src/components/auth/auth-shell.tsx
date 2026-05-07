import type { ReactNode } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type AuthShellProps = {
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
};

export function AuthShell({
  title,
  description,
  children,
  footer,
  className,
}: AuthShellProps) {
  return (
    <main className="relative flex min-h-svh items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,theme(colors.primary/12),transparent_38%),linear-gradient(180deg,theme(colors.background),theme(colors.muted/50))] px-4 py-10">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,theme(colors.border/35)_1px,transparent_1px),linear-gradient(to_bottom,theme(colors.border/35)_1px,transparent_1px)] bg-[size:40px_40px] opacity-35" />
      <div className="relative z-10 w-full max-w-md">
        <Card className={cn("border border-border/60 bg-background/95 shadow-2xl shadow-primary/5 backdrop-blur", className)}>
          <CardHeader className="space-y-2 border-b border-border/60 pb-5">
            <div className="inline-flex w-fit rounded-full border border-primary/20 bg-primary/8 px-3 py-1 text-xs font-medium tracking-[0.18em] text-primary uppercase">
              CI-PRS
            </div>
            <CardTitle className="text-2xl">{title}</CardTitle>
            <CardDescription className="leading-6">{description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 pt-5">{children}</CardContent>
          {footer ? <div className="border-t border-border/60 px-4 py-4 text-sm text-muted-foreground">{footer}</div> : null}
        </Card>
      </div>
    </main>
  );
}
