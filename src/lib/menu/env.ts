import type { NavLayoutMode } from "@/lib/api/domains/menu/contract";

const VALID_MODES: NavLayoutMode[] = ["sidebar", "top-menu"];

export function getNavLayout(): NavLayoutMode {
  const envValue = process.env.NEXT_PUBLIC_NAV_LAYOUT;

  if (!envValue) {
    return "sidebar";
  }

  if (VALID_MODES.includes(envValue as NavLayoutMode)) {
    return envValue as NavLayoutMode;
  }

  console.warn(
    `[Menu] Invalid NEXT_PUBLIC_NAV_LAYOUT value: "${envValue}". Falling back to "sidebar".`
  );
  return "sidebar";
}
