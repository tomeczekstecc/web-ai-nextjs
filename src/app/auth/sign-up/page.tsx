import { redirect } from "next/navigation";

import { AuthShell } from "@/components/auth/auth-shell";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { AUTH_ROUTES } from "@/lib/auth/redirects";
import { redirectIfAuthenticated } from "@/lib/auth/session";

export default async function SignUpPage() {
  if (process.env.AUTH_SIGNUP_ENABLED === "false") {
    redirect(AUTH_ROUTES.signIn);
  }

  await redirectIfAuthenticated();

  return (
    <AuthShell
      title="Utworz konto"
      description="Rozpocznij od lekkiego formularza. Dostep do aplikacji zostanie przyznany dopiero po potwierdzeniu konta i sprawdzeniu polityki dostepu."
    >
      <SignUpForm />
    </AuthShell>
  );
}
