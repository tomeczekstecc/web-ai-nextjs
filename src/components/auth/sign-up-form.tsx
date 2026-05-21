"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, type StandardSchemaV1 } from "@tanstack/react-form";
import { z } from "zod";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldDescription,
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
} from "@/lib/auth/redirects";

const genericResponse =
  "Jeśli konto mogło zostać utworzone, wyślemy dalsze instrukcje na podany adres e-mail.";

const signUpSchema = z.object({
  email: z.string().email("Nieprawidłowy adres e-mail."),
  username: z.string().optional(),
  password: z.string().min(12, "Hasło musi mieć co najmniej 12 znaków."),
  acceptedTerms: z.boolean().refine((v) => v === true, {
    message: "Zaakceptuj regulamin i zasady prywatności, aby kontynuować.",
  }),
});

type SignUpFormProps = {
  returnTo: string;
};

export function SignUpForm({ returnTo }: SignUpFormProps) {
  const router = useRouter();
  const [serverMessage, setServerMessage] = useState<string | null>(null);

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
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void form.handleSubmit();
      }}
    >
      <FieldGroup>
        {serverMessage ? (
          <Alert className="border-primary/20 bg-primary/10">
            <AlertDescription className="text-foreground">{serverMessage}</AlertDescription>
          </Alert>
        ) : null}

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
                Nazwa użytkownika (opcjonalnie)
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
                <FieldLabel htmlFor={field.name}>Hasło</FieldLabel>
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
                  aria-describedby={`${field.name}-hint`}
                />
                <p id={`${field.name}-hint`} className="text-xs text-muted-foreground">
                  Użyj co najmniej 12 znaków.
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
                    Akceptuję regulamin i zasady prywatności potrzebne do
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

        <Field>
          <Button className="w-full" disabled={form.state.isSubmitting} type="submit">
            {form.state.isSubmitting ? "Tworzenie konta…" : "Utwórz konto"}
          </Button>
        </Field>

        <FieldDescription className="text-center">
          Masz już konto?{" "}
          <Link
            className="font-medium text-primary underline-offset-4 hover:underline"
            href={buildSignInHref(returnTo)}
          >
            Wróć do logowania
          </Link>
        </FieldDescription>
      </FieldGroup>
    </form>
  );
}
