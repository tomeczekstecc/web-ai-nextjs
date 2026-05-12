"use client"

import { getNavLayout } from "@/lib/menu/env"
import type { NavLayoutMode } from "@/lib/api/domains/menu/contract"

export function useNavLayout(): NavLayoutMode {
  return getNavLayout()
}
