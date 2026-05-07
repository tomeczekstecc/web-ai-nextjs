"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { buildResetPasswordCallback, buildSignInHref, sanitizeReturnTo } from "@/lib/auth/redirects";

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const returnTo = useMemo(
    () => sanitizeReturnTo(searchParams.get("returnTo")),
    [searchParams],
  );

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleRequestReset(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setMessage(null);

    const result = await authClient.requestPasswordReset({
      email: email.trim(),
      redirectTo: buildResetPasswordCallback(returnTo),
    });

    setPending(false);

    if (result.error) {
      setError("Nie udalo sie wyslac wiadomosci. Sprobuj ponownie za chwile.");
      return;
    }

    setMessage("Jesli konto istnieje, wyslalismy wiadomosc z instrukcja resetu hasla.");
  }

  async function handleResetPassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token) {
      return;
    }

    if (password.length < 12) {
      setError("Haslo musi miec co najmniej 12 znakow.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Nowe haslo i potwierdzenie musza byc takie same.");
      return;
    }

    setPending(true);
    setError(null);
    setMessage(null);

    const result = await authClient.resetPassword({
      newPassword: password,
      token,
    });

    setPending(false);

    if (result.error) {
      setError("Nie udalo sie ustawic nowego hasla. Wygeneruj nowy link i sprobuj ponownie.");
      return;
    }

    router.replace(`${buildSignInHref(returnTo)}${buildSignInHref(returnTo).includes("?") ? "&" : "?"}message=reset`);
    router.refresh();
  }

  if (token) {
    return (
      <form className="space-y-4" onSubmit={handleResetPassword}>
        {error ? (
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        ) : null}
        <div className="space-y-2">
          <Label htmlFor="new-password">Nowe haslo</Label>
          <Input
            id="new-password"
            autoComplete="new-password"
            disabled={pending}
            onChange={(event) => setPassword(event.target.value)}
            required
            type="password"
            value={password}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm-password">Powtorz nowe haslo</Label>
          <Input
            id="confirm-password"
            autoComplete="new-password"
            disabled={pending}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
            type="password"
            value={confirmPassword}
          />
        </div>
        <Button className="w-full" disabled={pending} type="submit">
          {pending ? "Zapisywanie..." : "Ustaw nowe haslo"}
        </Button>
      </form>
    );
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
      <form className="space-y-4" onSubmit={handleRequestReset}>
        <div className="space-y-2">
          <Label htmlFor="reset-email">Adres e-mail</Label>
          <Input
            id="reset-email"
            autoComplete="email"
            disabled={pending}
            onChange={(event) => setEmail(event.target.value)}
            required
            type="email"
            value={email}
          />
        </div>
        <Button className="w-full" disabled={pending} type="submit">
          {pending ? "Wysylanie..." : "Wyslij link do resetu"}
        </Button>
      </form>
    </div>
  );
}
