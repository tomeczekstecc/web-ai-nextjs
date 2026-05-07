import { AuthShell } from "@/components/auth/auth-shell";
import { SignInForm } from "@/components/auth/sign-in-form";
import { SsoButton } from "@/components/auth/sso-button";
import { redirectIfAuthenticated } from "@/lib/auth/session";

export default async function SignInPage() {
  await redirectIfAuthenticated();

  const ssoEnabled = process.env.AUTH_SSO_ENABLED === "true";

  return (
    <AuthShell
      title="Zaloguj sie do panelu"
      description="Korzystaj z aplikacyjnego logowania i wroc do pracy bez opuszczania naszego interfejsu."
      footer={<p>Jesli korzystasz z dostepu organizacyjnego, mozesz wybrac oddzielna sciezke SSO.</p>}
    >
      <SignInForm />
      {ssoEnabled ? (
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-xs uppercase tracking-[0.18em] text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            <span>Opcjonalnie</span>
            <span className="h-px flex-1 bg-border" />
          </div>
          <SsoButton />
        </div>
      ) : null}
    </AuthShell>
  );
}
