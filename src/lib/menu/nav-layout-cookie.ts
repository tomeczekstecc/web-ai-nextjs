/**
 * Cookie name and server-side reader for the user's nav-layout preference.
 *
 * The cookie overrides the `NEXT_PUBLIC_NAV_LAYOUT` env default so users
 * can switch between "sidebar" and "top-menu" at runtime without a redeploy.
 */
import "server-only";

import { cookies } from "next/headers";

import type { NavLayoutMode } from "@/lib/api/domains/menu/contract";
import { getNavLayout } from "@/lib/menu/env";

export const NAV_LAYOUT_COOKIE = "nav-layout";
const VALID_MODES: NavLayoutMode[] = ["sidebar", "top-menu"];

/**
 * Read the user's saved nav-layout preference from the request cookie.
 * Falls back to the `NEXT_PUBLIC_NAV_LAYOUT` env default when no cookie is set.
 * Call this from Server Components and route handlers only.
 */
export async function getNavLayoutPreference(): Promise<NavLayoutMode> {
  const jar = await cookies();
  const value = jar.get(NAV_LAYOUT_COOKIE)?.value;

  if (value && VALID_MODES.includes(value as NavLayoutMode)) {
    return value as NavLayoutMode;
  }

  return getNavLayout();
}
