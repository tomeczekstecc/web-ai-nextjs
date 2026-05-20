"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, type StandardSchemaV1 } from "@tanstack/react-form";
import { z } from "zod";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
  buildSignInHref,
  buildVerifyEmailCallback,
  sanitizeReturnTo,
} from "@/lib/auth/redirects";

const genericResponse =
  "Jesli konto moglo zostac utworzone, wyslemy dalsze instrukcje na podany adres e-mail.";

const signUpSchema = z.object({
  email: z.string().email("Nieprawidlowy adres e-mail."),
  username: z.string().optional(),
  password: z.string().min(12, "Haslo musi miec co najmniej 12 znakow."),
  acceptedTerms: z.boolean().refine((v) => v === true, {
    message: "Zaakceptuj regulamin i zasady prywatnosci, aby kontynuowac.",
  }),
});

export function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [serverMessage, setServerMessage] = useState<string | null>(null);

  const returnTo = useMemo(
    () => sanitizeReturnTo(searchParams.get("returnTo")),
    [searchParams],
  );

  const form = useForm({
    defaultValues: {
      email: "",
      username: "",
      password: "",
      acceptedTerms: false,
    },
    validators: {
      // Zod v4 has a wider '~standard' type than TanStack Form expects; cast is safe at runtime
      onSubmit: signUpSchema as unknown as StandardSchemaV1<{
        email: string;
        username: string;
        password: string;
        acceptedTerms: boolean;
      }>,
    },
    onSubmit: async ({ value }) => {
      const result = await authClient.signUp.email({
        email: value.email.trim(),
        password: value.password,
        name: value.username?.trim() || value.email.trim(),
        username: value.username?.trim() || undefined,
      });

      if (result.error) {
        setServerMessage(genericResponse);
        return;
      }

      await authClient.sendVerificationEmail({
        email: value.email.trim(),
        callbackURL: buildVerifyEmailCallback(returnTo),
      });

      router.replace(
        `${AUTH_ROUTES.verifyEmail}?email=${encodeURIComponent(value.email.trim())}&returnTo=${encodeURIComponent(returnTo)}`,
      );
      router.refresh();
    },
  });

  return (
    <div className="space-y-5">
      {serverMessage ? (
        <Alert className="border-primary/20 bg-primary/10">
          <AlertDescription className="text-foreground">{serverMessage}</AlertDescription>
        </Alert>
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
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>Adres e-mail</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    autoComplete="email"
                    disabled={form.state.isSubmitting}
                    placeholder="jan@example.com"
                    type="email"
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
          <form.Field name="username">
            {(field) => (
              <Field>
                <FieldLabel htmlFor={field.name}>
                  Nazwa uzytkownika (opcjonalnie)
                </FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  autoComplete="username"
                  disabled={form.state.isSubmitting}
                  placeholder="jan.kowalski"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
              </Field>
            )}
          </form.Field>
          <form.Field name="password">
            {(field) => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>Haslo</FieldLabel>
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
                  <p className="text-xs text-muted-foreground">
                    Uzyj co najmniej 12 znakow.
                  </p>
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          </form.Field>
          <form.Field name="acceptedTerms">
            {(field) => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field
                  orientation="horizontal"
                  data-invalid={isInvalid}
                  className="rounded-lg border border-border/70 bg-muted/40 px-3 py-3"
                >
                  <Checkbox
                    id={field.name}
                    checked={field.state.value}
                    disabled={form.state.isSubmitting}
                    onCheckedChange={(checked) =>
                      field.handleChange(checked === true)
                    }
                    aria-invalid={isInvalid}
                  />
                  <div className="flex flex-col gap-1">
                    <FieldLabel htmlFor={field.name} className="text-sm leading-6">
                      Akceptuje regulamin i zasady prywatnosci potrzebne do
                      utworzenia konta.
                    </FieldLabel>
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </div>
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
          {form.state.isSubmitting ? "Tworzenie konta..." : "Utworz konto"}
        </Button>
      </form>
      <p className="text-sm text-muted-foreground">
        Masz juz konto?{" "}
        <Link
          className="font-medium text-primary underline-offset-4 hover:underline"
          href={buildSignInHref(returnTo)}
        >
          Wroc do logowania
        </Link>
      </p>
    </div>
  );
}
