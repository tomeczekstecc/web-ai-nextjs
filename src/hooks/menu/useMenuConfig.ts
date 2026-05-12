"use client";

import { useQuery } from "@tanstack/react-query";

import { menuConfigOptions } from "@/lib/api/domains/menu/query-options";

export function useMenuConfig() {
  return useQuery(menuConfigOptions());
}
