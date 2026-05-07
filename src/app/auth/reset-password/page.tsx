import { AuthShell } from "@/components/auth/auth-shell";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export default function ResetPasswordPage() {
  return (
    <AuthShell
      title="Reset hasla"
      description="Wyslij wiadomosc resetujaca albo ustaw nowe haslo z linku, ktory trafil do Twojej skrzynki."
    >
      <ResetPasswordForm />
    </AuthShell>
  );
}
