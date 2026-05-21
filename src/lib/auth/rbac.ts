import "server-only";

import { cache } from "react";
import { forbidden, unauthorized } from "next/navigation";

import {
  matchesSet,
  principalFromAppUser,
  toArray,
  type AppRole,
  type GateMode,
  type Principal,
} from "@/lib/auth/principal";
import { getAccessForCurrentRequest } from "@/lib/auth/session";
import {
  getMockBypassSession,
  isSessionBypassEnabled,
} from "@/lib/api/domains/auth-user/mock";

type CheckMode = GateMode;

/**
 * Resolve the current `Principal` for use in server components / route
 * handlers. Returns `null` when the request has no usable session.
 *
 * Memoized per request via `React.cache`: calling this in a layout, a page,
 * and a server action within the same render pass triggers exactly one
 * Better-Auth session read and one Laravel `/me` fetch. The bypass branch is
 * pure and cheap, so memoizing it too is just consistency.
 *
 * This is the **only** server-side place that knows about identity sources.
 * Today it derives from `LaravelAppUser`; when we wire Better-Auth
 * `organization` plugin, swap the body and call sites stay intact.
 */
export const getCurrentPrincipal = cache(
  async (): Promise<Principal | null> => {
    if (isSessionBypassEnabled()) {
      const mock = getMockBypassSession();
      return principalFromAppUser(mock.access.appUser);
    }

    const access = await getAccessForCurrentRequest();
    if (!access || access.status !== "authorized") return null;

    return principalFromAppUser(access.appUser);
  },
);

function matches<T>(
  values: readonly T[],
  required: readonly T[],
  mode: CheckMode,
): boolean {
  return matchesSet(values, required, mode);
}

/**
 * Server gate. Calls `unauthorized()` (HTTP 401, renders
 * `src/app/unauthorized.tsx`) if there is no session, or `forbidden()` (HTTP
 * 403, renders `src/app/forbidden.tsx`) if the role check fails.
 */
export async function requireRole(
  roles: AppRole | readonly AppRole[],
  mode: CheckMode = "any",
): Promise<Principal> {
  const required = toArray(roles);
  const principal = await getCurrentPrincipal();
  if (!principal) unauthorized();
  if (!matches(principal.roles, required, mode)) forbidden();
  return principal;
}

export async function requirePermission(
  permissions: string | readonly string[],
  mode: CheckMode = "any",
): Promise<Principal> {
  const required = toArray(permissions);
  const principal = await getCurrentPrincipal();
  if (!principal) unauthorized();
  if (!matches(principal.permissions, required, mode)) forbidden();
  return principal;
}

/**
 * Wrap a server action so it is **always** gated by a role check, regardless
 * of which UI invokes it. Page-level `requireRole` only protects rendering;
 * the underlying action endpoint is reachable by anyone with a valid session
 * cookie unless the action itself re-checks.
 *
 * Use:
 * ```ts
 * "use server";
 * export const archiveTask = withRole("Admin", async (principal, id: string) => {
 *   // … trusted body, `principal` already verified …
 * });
 * ```
 *
 * Throws `forbidden()`/`unauthorized()` before the wrapped body runs.
 * **Never wrap the result in try/catch** — doing so swallows the redirect
 * thrown by Next's auth interrupts and fails open.
 */
export function withRole<TArgs extends readonly unknown[], TRet>(
  roles: AppRole | readonly AppRole[],
  action: (principal: Principal, ...args: TArgs) => Promise<TRet>,
  mode: CheckMode = "any",
): (...args: TArgs) => Promise<TRet> {
  return async (...args: TArgs) => {
    const principal = await requireRole(roles, mode);
    return action(principal, ...args);
  };
}

/**
 * Permission-based variant of {@link withRole}. Prefer this when the action
 * maps cleanly to a `domain:action` permission — it keeps the surface
 * decoupled from role names.
 */
export function withPermission<TArgs extends readonly unknown[], TRet>(
  permissions: string | readonly string[],
  action: (principal: Principal, ...args: TArgs) => Promise<TRet>,
  mode: CheckMode = "any",
): (...args: TArgs) => Promise<TRet> {
  return async (...args: TArgs) => {
    const principal = await requirePermission(permissions, mode);
    return action(principal, ...args);
  };
}
