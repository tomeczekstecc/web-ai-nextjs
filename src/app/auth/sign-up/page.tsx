import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Card, CardContent } from "@/components/ui/card";
import { RightPanel } from "@/components/auth/right-panel";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { AUTH_ROUTES, sanitizeReturnTo } from "@/lib/auth/redirects";
import { redirectIfAuthenticated } from "@/lib/auth/session";

export const metadata: Metadata = {
  robots: { index: false },
};

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string }>;
}) {
  if (process.env.AUTH_SIGNUP_ENABLED === "false") {
    redirect(AUTH_ROUTES.signIn);
  }

  await redirectIfAuthenticated();

  const { returnTo: rawReturnTo } = await searchParams;
  const returnTo = sanitizeReturnTo(rawReturnTo ?? null);

  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6 md:max-w-4xl">
        <Card className="overflow-hidden p-0">
          <CardContent className="grid p-0 md:grid-cols-2">
            <div className="p-6 md:p-8">
              <div className="mb-6 flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">Utwórz konto</h1>
                <p className="text-balance text-muted-foreground">
                  Rozpocznij od lekkiego formularza. Dostęp zostanie przyznany po potwierdzeniu konta.
                </p>
              </div>
              <SignUpForm returnTo={returnTo} />
            </div>
            <RightPanel />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
