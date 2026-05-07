import { AuthShell } from "@/components/auth/auth-shell";
import { VerifyEmailStatus } from "@/components/auth/verify-email-status";

export default function VerifyEmailPage() {
  return (
    <AuthShell
      title="Potwierdz adres e-mail"
      description="Aktywuj konto z poziomu wiadomosci e-mail, a po pomyslnej weryfikacji od razu wrocisz do aplikacji."
    >
      <VerifyEmailStatus />
    </AuthShell>
  );
}
