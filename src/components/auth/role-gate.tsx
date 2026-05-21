"use client";

import * as React from "react";

import {
  matchesSet,
  toArray,
  type AppRole,
  type GateMode,
} from "@/lib/auth/principal";
import { useOptionalPrincipal } from "@/components/auth/principal-provider";

type Common = {
  mode?: GateMode;
  /** Rendered when the user fails the check. Defaults to `null` (silent). */
  fallback?: React.ReactNode;
  children: React.ReactNode;
};

/**
 * Dev-only warning when a gate renders without a `<PrincipalProvider>` above
 * it. In that case the gate always shows `fallback` (usually nothing), which
 * is a common cause of "my button disappeared" bugs on pages that forgot to
 * mount the provider.
 */
function useWarnMissingProvider(
  componentName: string,
  hasProvider: boolean,
  hasInputs: boolean,
) {
  React.useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    if (!hasProvider && hasInputs) {
      console.warn(
        `<${componentName}> is rendered without a <PrincipalProvider>. ` +
          `The gate will always render its fallback. Mount the provider in ` +
          `a parent server component (typically via AppShell), or render ` +
          `the gate inside an authenticated layout.`,
      );
    }
  }, [componentName, hasProvider, hasInputs]);
}

export type RoleGateProps = Common & {
  roles: AppRole | readonly AppRole[];
};

/**
 * Silent client gate, LSI-style (`<HasRole>`). Renders nothing when the
 * principal is missing or fails the check unless `fallback` is provided.
 *
 * **Security note:** this is UX only. Hiding a button does not stop the
 * underlying server action or fetch from being invoked by an attacker.
 * For real enforcement use `requireRole()` / `withRole()` from
 * `@/lib/auth/rbac` on every privileged server entry point.
 */
export function RoleGate({
  roles,
  mode = "any",
  fallback = null,
  children,
}: RoleGateProps) {
  const principal = useOptionalPrincipal();
  const required = toArray(roles);
  useWarnMissingProvider("RoleGate", principal !== null, required.length > 0);

  if (!principal) return <>{fallback}</>;
  if (required.length === 0) return <>{children}</>;

  const ok = matchesSet(principal.roles, required, mode);
  return <>{ok ? children : fallback}</>;
}

export type PermissionGateProps = Common & {
  permissions: string | readonly string[];
};

/**
 * Permission-keyed variant of {@link RoleGate}. Prefer this when the gate
 * maps cleanly to a `domain:action` permission so the UI stays decoupled
 * from role names.
 *
 * **Security note:** UX only \u2014 see {@link RoleGate} for details.
 */
export function PermissionGate({
  permissions,
  mode = "any",
  fallback = null,
  children,
}: PermissionGateProps) {
  const principal = useOptionalPrincipal();
  const required = toArray(permissions);
  useWarnMissingProvider("PermissionGate", principal !== null, required.length > 0);

  if (!principal) return <>{fallback}</>;
  if (required.length === 0) return <>{children}</>;

  const ok = matchesSet(principal.permissions, required, mode);
  return <>{ok ? children : fallback}</>;
}
