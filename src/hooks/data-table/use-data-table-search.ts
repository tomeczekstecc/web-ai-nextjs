import * as React from "react"
import type { DataTableColumnMeta, DataTableSearchOptions } from "@/lib/data-table/types"
import { defaultSearchCompare, getFallbackSearchValue } from "@/lib/data-table/utils"

type SearchableColumn<TData> = {
  id: string
  meta: DataTableColumnMeta<TData>
}

type UseDataTableSearchOptions<TData> = {
  searchOptions: DataTableSearchOptions<TData> | undefined
  isSearchEnabled: boolean
  initialSearchValue: string
  orderedData: TData[]
  searchableColumns: SearchableColumn<TData>[]
}

export function useDataTableSearch<TData>({
  searchOptions,
  isSearchEnabled,
  initialSearchValue,
  orderedData,
  searchableColumns,
}: UseDataTableSearchOptions<TData>) {
  const [localSearchValue, setLocalSearchValue] = React.useState(initialSearchValue)
  const searchValue = searchOptions?.value ?? localSearchValue

  const searchOnChangeRef = React.useRef(searchOptions?.onChange)
  // eslint-disable-next-line react-hooks/refs
  searchOnChangeRef.current = searchOptions?.onChange
  const isSearchControlled = searchOptions?.value !== undefined

  const setSearchValue = React.useCallback(
    (value: string) => {
      if (!isSearchControlled) {
        setLocalSearchValue(value)
      }
      searchOnChangeRef.current?.(value)
    },
    [isSearchControlled],
  )

  const filteredData = React.useMemo(() => {
    if (!isSearchEnabled || !searchValue.trim()) {
      return orderedData
    }

    return orderedData.filter((row) => {
      const values =
        searchOptions?.getSearchValues?.(row) ??
        searchableColumns.map(({ id, meta }) =>
          meta.getSearchValue ? meta.getSearchValue(row) : getFallbackSearchValue(row, id),
        )

      const compare = searchOptions?.compare ?? defaultSearchCompare
      return compare(searchValue, values, row)
    })
  }, [
    isSearchEnabled,
    orderedData,
    searchOptions,
    searchValue,
    searchableColumns,
  ])

  return { searchValue, setSearchValue, filteredData }
}
