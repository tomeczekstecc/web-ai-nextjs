"use client";

import { createContext, useContext } from "react";

import type { NavLayoutMode } from "@/lib/api/domains/menu/contract";

/**
 * Provides the resolved nav-layout mode (read from cookie or env by AppShell)
 * to any client component in the tree — NavUser dropdown, header toggles, etc.
 *
 * The provider is mounted once in AppShell (server component) and wraps both
 * layout branches, so the context value is always available regardless of
 * which layout is active.
 */
const NavLayoutCtx = createContext<NavLayoutMode>("sidebar");

export function NavLayoutProvider({
  mode,
  children,
}: {
  mode: NavLayoutMode;
  children: React.ReactNode;
}) {
  return <NavLayoutCtx value={mode}>{children}</NavLayoutCtx>;
}

/** Read the current nav-layout mode inside any client component. */
export function useCurrentNavLayout(): NavLayoutMode {
  return useContext(NavLayoutCtx);
}
