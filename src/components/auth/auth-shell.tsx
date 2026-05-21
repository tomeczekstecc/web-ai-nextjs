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
    <main className="flex min-h-svh flex-col items-center justify-center bg-muted px-4 py-10">
      <div className="w-full max-w-md">
        <Card className={cn("border border-border/60 shadow", className)}>
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl">{title}</CardTitle>
            <CardDescription className="leading-6">{description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 pt-0">{children}</CardContent>
          {footer ? (
            <div className="border-t border-border/60 px-4 py-4 text-sm text-muted-foreground">
              {footer}
            </div>
          ) : null}
        </Card>
      </div>
    </main>
  );
}
