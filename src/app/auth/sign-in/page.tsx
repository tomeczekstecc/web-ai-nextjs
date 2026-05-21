import type { Metadata } from "next";

import { Card, CardContent } from "@/components/ui/card";
import { RightPanel } from "@/components/auth/right-panel";
import { SignInForm } from "@/components/auth/sign-in-form";
import { enabledSocialProviders } from "@/lib/auth";
import { sanitizeReturnTo } from "@/lib/auth/redirects";
import { redirectIfAuthenticated } from "@/lib/auth/session";

export const metadata: Metadata = {
  robots: { index: false },
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string; message?: string }>;
}) {
  await redirectIfAuthenticated();

  // Social UI is shown only when at least one provider is configured
  // server-side AND the feature flag is on. Provider-level checks live in
  // `src/lib/auth.ts:buildSocialProviders`.
  const socialEnabled =
    process.env.AUTH_SOCIAL_LOGIN_ENABLED === "true" &&
    enabledSocialProviders.length > 0;

  const { returnTo: rawReturnTo, message } = await searchParams;
  const returnTo = sanitizeReturnTo(rawReturnTo ?? null);

  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6 md:max-w-4xl">
        <div className="flex flex-col gap-6">
          <Card className="overflow-hidden p-0">
            <CardContent className="grid p-0 md:grid-cols-2">
              <div className="p-6 md:p-8">
                <div className="mb-6 flex flex-col items-center gap-2 text-center">
                  <h1 className="text-2xl font-bold">Logowanie</h1>
                  <p className="text-balance text-muted-foreground">
                    Zaloguj się do aplikacji.
                  </p>
                </div>
                <SignInForm
                  returnTo={returnTo}
                  message={message ?? null}
                  socialEnabled={socialEnabled}
                  enabledProviders={enabledSocialProviders}
                />
              </div>
              <RightPanel />
            </CardContent>
          </Card>
          <p className="px-6 text-center text-sm text-muted-foreground">
            Kontynuując, akceptujesz nasze{" "}
            <a href="#" className="underline underline-offset-4 hover:text-primary">
              Warunki korzystania
            </a>{" "}
            i{" "}
            <a href="#" className="underline underline-offset-4 hover:text-primary">
              Politykę prywatności
            </a>
            .
          </p>
        </div>
      </div>
    </main>
  );
}
