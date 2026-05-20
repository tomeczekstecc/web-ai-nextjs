import { browserFetch } from "@/lib/api/core/browser-http";
import type { MenuConfig } from "@/lib/api/domains/menu/contract";

export async function fetchMenuConfig(): Promise<MenuConfig> {
  const result = await browserFetch<MenuConfig>("/config/menu");
  if (!result.ok) throw new Error(result.error.message);
  return result.data;
}
