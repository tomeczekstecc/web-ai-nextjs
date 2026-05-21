"use client";

import * as React from "react";

import type { AppRole, GateMode } from "@/lib/auth/principal";
import { RoleGate, PermissionGate } from "@/components/auth/role-gate";

const defaultFallback = (
  <div className="rounded-md border border-dashed bg-muted/30 p-4 text-sm text-muted-foreground">
    Nie masz dostępu do tego zasobu.
  </div>
);

/**
 * Visible-fallback client gate, LSI-style (`<AuthorizedView>`).
 *
 * Renders a "Nie masz dostępu do tego zasobu." block instead of nothing.
 * Use for page regions; for menu items / buttons prefer `<RoleGate>` /
 * `<PermissionGate>`.
 *
 * **Security note:** UX only. Hiding a region does not stop the underlying
 * server action or fetch from being invoked. Always pair with a server-side
 * `requireRole()` / `withRole()` (or `requirePermission()` / `withPermission()`)
 * on every privileged entry point.
 */
export function AuthorizedView({
  roles,
  permissions,
  mode = "any",
  fallback,
  children,
}: {
  roles?: AppRole | readonly AppRole[];
  permissions?: string | readonly string[];
  mode?: GateMode;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}) {
  const fb = fallback ?? defaultFallback;

  // Dev-time foot-gun guard: a bare <AuthorizedView>{x}</AuthorizedView> with
  // no roles/permissions renders unconditionally. That is occasionally what
  // the author wants (escape hatch), but more often it is a forgotten prop.
  React.useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    if (roles === undefined && permissions === undefined) {
      console.warn(
        "<AuthorizedView> received neither `roles` nor `permissions` and " +
          "is rendering its children unconditionally. If this is intentional " +
          "(escape hatch), drop the wrapper; otherwise add the missing prop.",
      );
    }
  }, [roles, permissions]);

  if (permissions !== undefined) {
    return (
      <PermissionGate permissions={permissions} mode={mode} fallback={fb}>
        {children}
      </PermissionGate>
    );
  }

  if (roles !== undefined) {
    return (
      <RoleGate roles={roles} mode={mode} fallback={fb}>
        {children}
      </RoleGate>
    );
  }

  // Neither roles nor permissions specified — pass through. Matches LSI's
  // `mode="pass"` escape hatch without making it a foot-gun default.
  return <>{children}</>;
}
