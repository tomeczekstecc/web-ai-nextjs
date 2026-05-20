"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, type StandardSchemaV1 } from "@tanstack/react-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import {
  buildResetPasswordCallback,
  buildSignInHref,
  sanitizeReturnTo,
} from "@/lib/auth/redirects";

// ── Schemas ────────────────────────────────────────────────────────────────────

const requestResetSchema = z.object({
  email: z.string().email("Nieprawidlowy adres e-mail."),
});

const setNewPasswordSchema = z.object({
  password: z.string().min(12, "Haslo musi miec co najmniej 12 znakow."),
  confirmPassword: z.string(),
});

// ── RequestResetForm ───────────────────────────────────────────────────────────

function RequestResetForm({ returnTo }: { returnTo: string }) {
  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm({
    defaultValues: { email: "" },
    validators: {
      // Zod v4 has a wider '~standard' type than TanStack Form expects; cast is safe at runtime
      onSubmit: requestResetSchema as unknown as StandardSchemaV1<{ email: string }>,
    },
    onSubmit: async ({ value }) => {
      setServerError(null);
      setServerMessage(null);

      const result = await authClient.requestPasswordReset({
        email: value.email.trim(),
        redirectTo: buildResetPasswordCallback(returnTo),
      });

      if (result.error) {
        setServerError(
          "Nie udalo sie wyslac wiadomosci. Sprobuj ponownie za chwile.",
        );
        return;
      }

      setServerMessage(
        "Jesli konto istnieje, wyslalismy wiadomosc z instrukcja resetu hasla.",
      );
    },
  });

  return (
    <div className="space-y-5">
      {serverMessage ? (
        <div className="rounded-lg border border-primary/20 bg-primary/10 px-3 py-2 text-sm text-foreground">
          {serverMessage}
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
          <form.Field name="email">
            {(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>Adres e-mail</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    autoComplete="email"
                    disabled={form.state.isSubmitting}
                    type="email"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={isInvalid}
                  />
                  {isInvalid && (
                    <FieldError errors={field.state.meta.errors} />
                  )}
                </Field>
              );
            }}
          </form.Field>
        </FieldGroup>
        <Button
          className="w-full"
          disabled={form.state.isSubmitting}
          type="submit"
        >
          {form.state.isSubmitting ? "Wysylanie..." : "Wyslij link do resetu"}
        </Button>
      </form>
    </div>
  );
}

// ── SetNewPasswordForm ─────────────────────────────────────────────────────────

function SetNewPasswordForm({
  token,
  returnTo,
}: {
  token: string;
  returnTo: string;
}) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm({
    defaultValues: { password: "", confirmPassword: "" },
    validators: {
      // Zod v4 has a wider '~standard' type than TanStack Form expects; cast is safe at runtime
      onSubmit: setNewPasswordSchema as unknown as StandardSchemaV1<{ password: string; confirmPassword: string }>,
    },
    onSubmit: async ({ value }) => {
      setServerError(null);

      const result = await authClient.resetPassword({
        newPassword: value.password,
        token,
      });

      if (result.error) {
        setServerError(
          "Nie udalo sie ustawic nowego hasla. Wygeneruj nowy link i sprobuj ponownie.",
        );
        return;
      }

      const signInHref = buildSignInHref(returnTo);
      router.replace(
        `${signInHref}${signInHref.includes("?") ? "&" : "?"}message=reset`,
      );
      router.refresh();
    },
  });

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void form.handleSubmit();
      }}
    >
      {serverError ? (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {serverError}
        </div>
      ) : null}
      <FieldGroup>
        <form.Field name="password">
          {(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid;
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Nowe haslo</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  autoComplete="new-password"
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
        <form.Field
          name="confirmPassword"
          validators={{
            onSubmit: ({ value, fieldApi }) => {
              if (value !== fieldApi.form.getFieldValue("password")) {
                return "Nowe haslo i potwierdzenie musza byc takie same.";
              }
            },
          }}
        >
          {(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid;
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Powtorz nowe haslo</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  autoComplete="new-password"
                  disabled={form.state.isSubmitting}
                  type="password"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  aria-invalid={isInvalid}
                />
                {isInvalid && (
                  <FieldError>
                    {String(field.state.meta.errors[0])}
                  </FieldError>
                )}
              </Field>
            );
          }}
        </form.Field>
      </FieldGroup>
      <Button
        className="w-full"
        disabled={form.state.isSubmitting}
        type="submit"
      >
        {form.state.isSubmitting ? "Zapisywanie..." : "Ustaw nowe haslo"}
      </Button>
    </form>
  );
}

// ── ResetPasswordForm (exported) ───────────────────────────────────────────────

export function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const returnTo = useMemo(
    () => sanitizeReturnTo(searchParams.get("returnTo")),
    [searchParams],
  );

  if (token) {
    return <SetNewPasswordForm token={token} returnTo={returnTo} />;
  }

  return <RequestResetForm returnTo={returnTo} />;
}
