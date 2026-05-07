"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { AUTH_ROUTES, buildSignInHref, buildVerifyEmailCallback, sanitizeReturnTo } from "@/lib/auth/redirects";

const genericResponse = "Jesli konto moglo zostac utworzone, wyslemy dalsze instrukcje na podany adres e-mail.";

export function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const returnTo = useMemo(
    () => sanitizeReturnTo(searchParams.get("returnTo")),
    [searchParams],
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!acceptedTerms) {
      setError("Zaakceptuj regulamin i zasady prywatnosci, aby kontynuowac.");
      return;
    }

    if (password.length < 12) {
      setError("Haslo musi miec co najmniej 12 znakow.");
      return;
    }

    setPending(true);
    setError(null);
    setMessage(null);

    const result = await authClient.signUp.email({
      email: email.trim(),
      password,
      name: username.trim() || email.trim(),
      username: username.trim() || undefined,
    });

    if (result.error) {
      setMessage(genericResponse);
      setPending(false);
      return;
    }

    await authClient.sendVerificationEmail({
      email: email.trim(),
      callbackURL: buildVerifyEmailCallback(returnTo),
    });

    router.replace(
      `${AUTH_ROUTES.verifyEmail}?email=${encodeURIComponent(email.trim())}&returnTo=${encodeURIComponent(returnTo)}`,
    );
    router.refresh();
  }

  return (
    <div className="space-y-5">
      {message ? (
        <div className="rounded-lg border border-primary/20 bg-primary/10 px-3 py-2 text-sm text-foreground">
          {message}
        </div>
      ) : null}
      {error ? (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      ) : null}
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <Label htmlFor="signup-email">Adres e-mail</Label>
          <Input
            id="signup-email"
            autoComplete="email"
            disabled={pending}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="jan@example.com"
            required
            type="email"
            value={email}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="signup-username">Nazwa uzytkownika (opcjonalnie)</Label>
          <Input
            id="signup-username"
            autoComplete="username"
            disabled={pending}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="jan.kowalski"
            value={username}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="signup-password">Haslo</Label>
          <Input
            id="signup-password"
            autoComplete="new-password"
            disabled={pending}
            onChange={(event) => setPassword(event.target.value)}
            required
            type="password"
            value={password}
          />
          <p className="text-xs text-muted-foreground">Uzyj co najmniej 12 znakow.</p>
        </div>
        <div className="flex items-start gap-3 rounded-lg border border-border/70 bg-muted/40 px-3 py-3">
          <Checkbox checked={acceptedTerms} onCheckedChange={(value) => setAcceptedTerms(Boolean(value))} />
          <Label className="items-start text-sm leading-6">
            Akceptuje regulamin i zasady prywatnosci potrzebne do utworzenia konta.
          </Label>
        </div>
        <Button className="w-full" disabled={pending} type="submit">
          {pending ? "Tworzenie konta..." : "Utworz konto"}
        </Button>
      </form>
      <p className="text-sm text-muted-foreground">
        Masz juz konto?{" "}
        <Link className="font-medium text-primary underline-offset-4 hover:underline" href={buildSignInHref(returnTo)}>
          Wroc do logowania
        </Link>
      </p>
    </div>
  );
}
