"use client";

import Link from "next/link";
import { startTransition, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, type StandardSchemaV1 } from "@tanstack/react-form";
import { z } from "zod";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import {
  AUTH_ROUTES,
  buildAuthSuccessHref,
  buildSignUpHref,
  sanitizeReturnTo,
} from "@/lib/auth/redirects";
import { cn } from "@/lib/utils";

const signInSchema = z.object({
  identifier: z.string().min(1, "Podaj adres e-mail lub nazwe uzytkownika."),
  password: z.string().min(1, "Podaj haslo."),
});

const genericError = "Nie udalo sie zalogowac. Sprawdz dane i sprobuj ponownie.";

export function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [serverError, setServerError] = useState<string | null>(null);

  const returnTo = useMemo(
    () => sanitizeReturnTo(searchParams.get("returnTo")),
    [searchParams],
  );
  const message = searchParams.get("message");

  const form = useForm({
    defaultValues: {
      identifier: "",
      password: "",
    },
    validators: {
      // Zod v4 has a wider '~standard' type than TanStack Form expects; cast is safe at runtime
      onSubmit: signInSchema as unknown as StandardSchemaV1<{ identifier: string; password: string }>,
    },
    onSubmit: async ({ value }) => {
      setServerError(null);

      const nextHref = buildAuthSuccessHref(returnTo);
      const trimmedIdentifier = value.identifier.trim();

      const result = trimmedIdentifier.includes("@")
        ? await authClient.signIn.email({
            email: trimmedIdentifier,
            password: value.password,
            callbackURL: nextHref,
            rememberMe: true,
          })
        : await authClient.signIn.username({
            username: trimmedIdentifier,
            password: value.password,
            callbackURL: nextHref,
            rememberMe: true,
          });

      if (result.error) {
        setServerError(genericError);
        return;
      }

      startTransition(() => {
        router.replace(nextHref);
        router.refresh();
      });
    },
  });

  return (
    <div className="space-y-5">
      {message === "reset" ? (
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300">
          Haslo zostalo zmienione. Mozesz zalogowac sie nowymi danymi.
        </div>
      ) : null}
      {serverError ? (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {serverError}
        </div>
      ) : null}
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          void form.handleSubmit();
        }}
      >
        <FieldGroup>
          <form.Field name="identifier">
            {(field) => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>
                    Adres e-mail lub nazwa uzytkownika
                  </FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    autoComplete="username"
                    disabled={form.state.isSubmitting}
                    placeholder="jan.kowalski albo jan@example.com"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={isInvalid}
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          </form.Field>
          <form.Field name="password">
            {(field) => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <div className="flex items-center justify-between gap-3">
                    <FieldLabel htmlFor={field.name}>Haslo</FieldLabel>
                    <Link
                      className={cn(
                        buttonVariants({ variant: "link", size: "sm" }),
                        "h-auto px-0 text-sm",
                      )}
                      href={`${AUTH_ROUTES.resetPassword}?returnTo=${encodeURIComponent(returnTo)}`}
                    >
                      Nie pamietasz hasla?
                    </Link>
                  </div>
                  <Input
                    id={field.name}
                    name={field.name}
                    autoComplete="current-password"
                    disabled={form.state.isSubmitting}
                    type="password"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={isInvalid}
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          </form.Field>
        </FieldGroup>
        <Button className="w-full" disabled={form.state.isSubmitting} type="submit">
          {form.state.isSubmitting ? "Logowanie..." : "Zaloguj sie"}
        </Button>
      </form>
      <p className="text-sm text-muted-foreground">
        Nie masz jeszcze konta?{" "}
        <Link
          className="font-medium text-primary underline-offset-4 hover:underline"
          href={buildSignUpHref(returnTo)}
        >
          Utworz konto
        </Link>
      </p>
    </div>
  );
}
