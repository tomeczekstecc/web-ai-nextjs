import Link from "next/link";

import { AuthShell } from "@/components/auth/auth-shell";
import { buttonVariants } from "@/components/ui/button";

export default function AccessDeniedPage() {
  return (
    <AuthShell
      title="Brak dostepu do aplikacji"
      description="To konto nie moze teraz otworzyc chronionej czesci systemu. Jesli powinienes miec dostep, skontaktuj sie z administratorem."
    >
      <div className="space-y-4">
        <div className="rounded-lg border border-border/70 bg-muted/40 px-3 py-3 text-sm leading-6 text-muted-foreground">
          Zalogowanie powiodlo sie, ale nie mozemy udostepnic panelu dla tego konta.
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link className={buttonVariants({ variant: "default" })} href="/sign-in">
            Wroc do logowania
          </Link>
          <Link className={buttonVariants({ variant: "outline" })} href="/">
            Przejdz na strone glowna
          </Link>
        </div>
      </div>
    </AuthShell>
  );
}
