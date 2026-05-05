import Link from "next/link";

import { AuthShell } from "@/components/auth/auth-shell";
import { buttonVariants } from "@/components/ui/button";

export default function AuthUnavailablePage() {
  return (
    <AuthShell
      title="Tymczasowy problem z dostepem"
      description="Warstwa autoryzacji jest chwilowo niedostepna. Nie pokazalismy chronionej tresci, aby zachowac bezpieczny stan aplikacji."
    >
      <div className="space-y-4">
        <div className="rounded-lg border border-border/70 bg-muted/40 px-3 py-3 text-sm leading-6 text-muted-foreground">
          Sprobuj odswiezyc strone za chwile. Jesli problem bedzie sie powtarzal, wroc do logowania i ponow probe pozniej.
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link className={buttonVariants({ variant: "default" })} href="/dashboard">
            Sprobuj ponownie
          </Link>
          <Link className={buttonVariants({ variant: "outline" })} href="/sign-in">
            Wroc do logowania
          </Link>
        </div>
      </div>
    </AuthShell>
  );
}
