"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { startTransition, useMemo, useState } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { buildAuthSuccessHref, buildSignUpHref, sanitizeReturnTo } from "@/lib/auth/redirects";
import { cn } from "@/lib/utils";

const genericError = "Nie udalo sie zalogowac. Sprawdz dane i sprobuj ponownie.";

export function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const returnTo = useMemo(
    () => sanitizeReturnTo(searchParams.get("returnTo")),
    [searchParams],
  );
  const message = searchParams.get("message");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const nextHref = buildAuthSuccessHref(returnTo);
    const trimmedIdentifier = identifier.trim();

    const result = trimmedIdentifier.includes("@")
      ? await authClient.signIn.email({
          email: trimmedIdentifier,
          password,
          callbackURL: nextHref,
          rememberMe: true,
        })
      : await authClient.signIn.username({
          username: trimmedIdentifier,
          password,
          callbackURL: nextHref,
          rememberMe: true,
        });

    if (result.error) {
      setError(genericError);
      setPending(false);
      return;
    }

    startTransition(() => {
      router.replace(nextHref);
      router.refresh();
    });
  }

  return (
    <div className="space-y-5">
      {message === "reset" ? (
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300">
          Haslo zostalo zmienione. Mozesz zalogowac sie nowymi danymi.
        </div>
      ) : null}
      {error ? (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      ) : null}
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <Label htmlFor="identifier">Adres e-mail lub nazwa uzytkownika</Label>
          <Input
            id="identifier"
            autoComplete="username"
            disabled={pending}
            onChange={(event) => setIdentifier(event.target.value)}
            placeholder="jan.kowalski albo jan@example.com"
            required
            value={identifier}
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="password">Haslo</Label>
            <Link
              className={cn(buttonVariants({ variant: "link", size: "sm" }), "h-auto px-0 text-sm")}
              href={`/reset-password?returnTo=${encodeURIComponent(returnTo)}`}
            >
              Nie pamietasz hasla?
            </Link>
          </div>
          <Input
            id="password"
            autoComplete="current-password"
            disabled={pending}
            onChange={(event) => setPassword(event.target.value)}
            required
            type="password"
            value={password}
          />
        </div>
        <Button className="w-full" disabled={pending} type="submit">
          {pending ? "Logowanie..." : "Zaloguj sie"}
        </Button>
      </form>
      <p className="text-sm text-muted-foreground">
        Nie masz jeszcze konta?{" "}
        <Link className="font-medium text-primary underline-offset-4 hover:underline" href={buildSignUpHref(returnTo)}>
          Utworz konto
        </Link>
      </p>
    </div>
  );
}
