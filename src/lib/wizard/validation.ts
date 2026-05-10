import { z } from 'zod'
import type { ValidationItem } from '@/lib/store/types'
import type { SummaryResult } from '@/lib/wizard/types'

export function runPageSchema(schema: z.ZodSchema, form: unknown): ValidationItem[] {
  const result = schema.safeParse(form)
  if (result.success) return []

  const map = new Map<string, string[]>()
  for (const issue of result.error.issues) {
    const key = String(issue.path[0] ?? '')
    const bucket = map.get(key) ?? []
    bucket.push(issue.message)
    map.set(key, bucket)
  }

  return Array.from(map.entries()).map(([key, msgs]) => ({ key, type: 'error', msgs }))
}

export function parseSummaryResult(result: SummaryResult): ValidationItem[] {
  const items: ValidationItem[] = []
  const errorKeys = new Set<string>()

  for (const [key, msgs] of Object.entries(result.error ?? {})) {
    errorKeys.add(key)
    items.push({ key, type: 'error', msgs })
  }

  for (const [key, msgs] of Object.entries(result.warning ?? {})) {
    if (!errorKeys.has(key)) {
      items.push({ key, type: 'warning', msgs })
    }
  }

  return items
}
