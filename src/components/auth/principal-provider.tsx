"use client";

import * as React from "react";

import {
  matchesSet,
  toArray,
  type AppRole,
  type GateMode,
  type Principal,
} from "@/lib/auth/principal";

const PrincipalContext = React.createContext<Principal | null>(null);

export function PrincipalProvider({
  principal,
  children,
}: {
  principal: Principal;
  children: React.ReactNode;
}) {
  return (
    <PrincipalContext.Provider value={principal}>
      {children}
    </PrincipalContext.Provider>
  );
}

/**
 * Read the current `Principal` from context. Returns `null` outside the
 * provider (e.g. on public auth pages). Most callers should prefer
 * `usePrincipal()` which throws when the value is missing.
 */
export function useOptionalPrincipal(): Principal | null {
  return React.useContext(PrincipalContext);
}

export type PrincipalHelpers = Principal & {
  hasRole: (role: AppRole | readonly AppRole[], mode?: GateMode) => boolean;
  hasPermission: (perm: string | readonly string[], mode?: GateMode) => boolean;
};

export function usePrincipal(): PrincipalHelpers {
  const principal = React.useContext(PrincipalContext);
  if (!principal) {
    throw new Error(
      "usePrincipal() must be used inside <PrincipalProvider>. " +
        "On public pages call useOptionalPrincipal() instead.",
    );
  }

  return React.useMemo<PrincipalHelpers>(() => {
    const hasRole = (
      role: AppRole | readonly AppRole[],
      mode: GateMode = "any",
    ) => matchesSet(principal.roles, toArray(role), mode);
    const hasPermission = (
      perm: string | readonly string[],
      mode: GateMode = "any",
    ) => matchesSet(principal.permissions, toArray(perm), mode);
    return { ...principal, hasRole, hasPermission };
  }, [principal]);
}
