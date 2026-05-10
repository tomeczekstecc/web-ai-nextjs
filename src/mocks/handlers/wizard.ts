import { http, HttpResponse } from 'msw'
import type { PageMapping, SummaryResult } from '@/lib/wizard/types'

export function createWizardMappingHandler(url: string, pages: PageMapping[]) {
  return http.get(url, () => HttpResponse.json(pages))
}

export function createWizardDataHandler(url: string, data: Record<string, unknown>) {
  return http.get(url, () => HttpResponse.json(data))
}

export function createWizardSaveHandler(url: string) {
  return http.put(url, () => HttpResponse.json({ ok: true }))
}

export function createWizardValidationHandler(url: string, result: SummaryResult) {
  return http.get(url, () => HttpResponse.json(result, { status: 422 }))
}
