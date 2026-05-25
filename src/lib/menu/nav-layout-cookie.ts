/**
 * Nav-layout resolver — reads the layout mode from the environment only.
 * User switching via cookie has been removed; change `NEXT_PUBLIC_NAV_LAYOUT`
 * in `.env` to switch between "sidebar" and "top-menu".
 */
import "server-only";

import type { NavLayoutMode } from "@/lib/api/domains/menu/contract";
import { getNavLayout } from "@/lib/menu/env";

/**
 * Returns the configured nav-layout mode from the environment.
 * Call this from Server Components and route handlers only.
 */
export async function getNavLayoutPreference(): Promise<NavLayoutMode> {
  return getNavLayout();
}
