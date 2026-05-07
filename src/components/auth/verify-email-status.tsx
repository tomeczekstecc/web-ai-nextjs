"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { buildAuthSuccessHref, buildSignInHref, buildVerifyEmailCallback, sanitizeReturnTo } from "@/lib/auth/redirects";

export function VerifyEmailStatus() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"idle" | "verifying" | "success" | "error" | "resent">("idle");
  const [pending, setPending] = useState(false);
  const hasTriggeredVerification = useRef(false);

  const email = searchParams.get("email");
  const token = searchParams.get("token");
  const returnTo = useMemo(
    () => sanitizeReturnTo(searchParams.get("returnTo")),
    [searchParams],
  );

  useEffect(() => {
    if (!token || hasTriggeredVerification.current) {
      return;
    }

    hasTriggeredVerification.current = true;
    setStatus("verifying");

    void authClient.verifyEmail({
      query: {
        token,
      },
    }).then((result) => {
      if (result.error) {
        setStatus("error");
        return;
      }

      setStatus("success");
      router.replace(buildAuthSuccessHref(returnTo));
      router.refresh();
    });
  }, [returnTo, router, token]);

  async function handleResend() {
    if (!email) {
      return;
    }

    setPending(true);
    setStatus("idle");

    const result = await authClient.sendVerificationEmail({
      email,
      callbackURL: buildVerifyEmailCallback(returnTo),
    });

    setPending(false);
    setStatus(result.error ? "error" : "resent");
  }

  if (status === "verifying") {
    return <p className="text-sm text-muted-foreground">Trwa potwierdzanie adresu e-mail...</p>;
  }

  if (status === "error") {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          Nie udalo sie potwierdzic adresu e-mail. Sprobuj wyslac wiadomosc ponownie.
        </div>
        {email ? (
          <Button disabled={pending} onClick={handleResend} type="button" variant="outline">
            {pending ? "Wysylanie..." : "Wyslij ponownie"}
          </Button>
        ) : null}
      </div>
    );
  }

  if (status === "resent") {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-primary/20 bg-primary/10 px-3 py-2 text-sm text-foreground">
          Jesli adres e-mail jest gotowy do potwierdzenia, wyslalismy nowa wiadomosc z linkiem.
        </div>
        <Link className="text-sm font-medium text-primary underline-offset-4 hover:underline" href={buildSignInHref(returnTo)}>
          Wroc do logowania
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border/70 bg-muted/40 px-3 py-3 text-sm leading-6 text-muted-foreground">
        {email
          ? `Sprawdz skrzynke ${email}. Otworz wiadomosc i kliknij link, aby aktywowac konto.`
          : "Sprawdz skrzynke e-mail i kliknij link potwierdzajacy, aby aktywowac konto."}
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button disabled={!email || pending} onClick={handleResend} type="button" variant="outline">
          {pending ? "Wysylanie..." : "Wyslij wiadomosc ponownie"}
        </Button>
        <Link className="inline-flex h-8 items-center text-sm font-medium text-primary underline-offset-4 hover:underline" href={buildSignInHref(returnTo)}>
          Wroc do logowania
        </Link>
      </div>
    </div>
  );
}
