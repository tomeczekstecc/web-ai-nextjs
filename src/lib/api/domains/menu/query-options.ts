import { queryOptions } from "@tanstack/react-query";

import { fetchMenuConfig } from "@/lib/api/domains/menu/client";
import { menuKeys } from "@/lib/api/domains/menu/query-keys";

export function menuConfigOptions() {
  return queryOptions({
    queryKey: menuKeys.config(),
    queryFn: fetchMenuConfig,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });
}
