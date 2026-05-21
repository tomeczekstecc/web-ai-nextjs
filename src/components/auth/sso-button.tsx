import { Button } from "@/components/ui/button";
import { AUTH_ROUTES, buildAuthSuccessHref } from "@/lib/auth/redirects";

type SsoButtonProps = {
  returnTo: string;
};

export function SsoButton({ returnTo }: SsoButtonProps) {
  return (
    <form action="/api/auth/sign-in/oauth2" className="w-full" method="POST">
      <input name="providerId" type="hidden" value="keycloak" />
      <input name="callbackURL" type="hidden" value={buildAuthSuccessHref(returnTo)} />
      <input name="errorCallbackURL" type="hidden" value={AUTH_ROUTES.signIn} />
      <input name="newUserCallbackURL" type="hidden" value={buildAuthSuccessHref(returnTo)} />
      <Button className="w-full" type="submit" variant="outline">
        Zaloguj przez SSO
      </Button>
    </form>
  );
}
