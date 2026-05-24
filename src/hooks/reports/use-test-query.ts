import { useMutation } from '@tanstack/react-query'
import { submitTestQuery } from '@/lib/api/domains/reports/commands'
import type { TestQueryInput, TestQueryResponse } from '@/lib/api/domains/reports/contract'

/**
 * Fires a POST /reports/test-query and surfaces the tabular result.
 * No cache invalidation — this is a transient preview, not a state change.
 * Error/success feedback is rendered inline by the caller; no toast needed.
 */
export function useTestQuery() {
  return useMutation<TestQueryResponse, Error, TestQueryInput>({
    mutationFn: submitTestQuery,
  })
}
