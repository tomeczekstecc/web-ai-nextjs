"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import type { NavLayoutMode } from "@/lib/api/domains/menu/contract";
import { NAV_LAYOUT_COOKIE } from "@/lib/menu/nav-layout-cookie";

const VALID_MODES: NavLayoutMode[] = ["sidebar", "top-menu"];

/**
 * Persist the user's nav-layout preference in a long-lived cookie and
 * revalidate the whole layout so AppShell re-renders with the new mode.
 *
 * Called from the `NavLayoutToggle` client component via `useTransition`.
 */
export async function setNavLayoutAction(mode: NavLayoutMode): Promise<void> {
  if (!VALID_MODES.includes(mode)) return;

  const jar = await cookies();
  jar.set(NAV_LAYOUT_COOKIE, mode, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 year
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  // Invalidate the root layout so AppShell picks up the new cookie on the
  // very next render without requiring a hard reload.
  revalidatePath("/", "layout");
}
