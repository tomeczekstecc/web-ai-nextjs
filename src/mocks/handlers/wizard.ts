import { http, HttpResponse } from 'msw'
import type { PageMapping, SummaryResult } from '@/lib/wizard/types'

// Per-wizard in-memory store of the last-saved form.
// Mirrors what a real backend session would hold between PUT /save and
// GET /validate so the mock can compute realistic validation results.
const wizardFormStore = new Map<string, Record<string, unknown>>()

export function getMockWizardForm(key: string): Record<string, unknown> {
  return wizardFormStore.get(key) ?? {}
}

export function setMockWizardForm(key: string, form: Record<string, unknown>) {
  wizardFormStore.set(key, form)
}

export function createWizardMappingHandler(url: string, pages: PageMapping[]) {
  return http.get(url, () => HttpResponse.json(pages))
}

export function createWizardDataHandler(
  url: string,
  data: Record<string, unknown>,
  key?: string,
) {
  return http.get(url, () => {
    if (key) setMockWizardForm(key, data)
    return HttpResponse.json(data)
  })
}

export function createWizardSaveHandler(url: string, key?: string) {
  return http.put(url, async ({ request }) => {
    if (key) {
      try {
        const body = (await request.json()) as Record<string, unknown>
        const prev = wizardFormStore.get(key) ?? {}
        setMockWizardForm(key, { ...prev, ...body })
      } catch {
        // ignore — empty/non-JSON bodies are fine in dev
      }
    }
    return HttpResponse.json({ ok: true })
  })
}

type ValidationSource =
  | SummaryResult
  | ((form: Record<string, unknown>) => SummaryResult)

export function createWizardValidationHandler(
  url: string,
  source: ValidationSource,
  key?: string,
) {
  return http.get(url, () => {
    const form = key ? getMockWizardForm(key) : {}
    const result = typeof source === 'function' ? source(form) : source
    const hasErrors =
      Object.keys(result.error ?? {}).length > 0 ||
      Object.keys(result.dicts_msg?.error ?? {}).length > 0
    return HttpResponse.json(result, { status: hasErrors ? 422 : 200 })
  })
}
