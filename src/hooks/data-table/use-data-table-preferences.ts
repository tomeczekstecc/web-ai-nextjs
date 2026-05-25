import * as React from "react"
import type { DataTablePreferences } from "@/lib/data-table/types"
import { readPreferences } from "@/lib/data-table/utils"

export function useDataTablePreferences(resolvedKey: string | undefined) {
  // readPreferences is synchronous — initialise eagerly to avoid an effect
  // that would cause a cascading re-render (react-hooks/set-state-in-effect).
  const [initialPreferences] = React.useState<DataTablePreferences>(() =>
    resolvedKey ? readPreferences(resolvedKey) : {}
  )

  return { initialPreferences, preferencesLoaded: true as const }
}
