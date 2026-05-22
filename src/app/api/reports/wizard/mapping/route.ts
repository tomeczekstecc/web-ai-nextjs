import { NextResponse } from 'next/server'
import type { PageMapping } from '@/lib/wizard/types'

const mapping: PageMapping[] = [
  {
    name: 'dane-podstawowe',
    label: 'Dane podstawowe',
    fields: [
      { name: 'status', label: 'Status', type: 'select', lp: 1, display: true },
      { name: 'name', label: 'Nazwa', type: 'input', lp: 2, display: true },
      { name: 'description', label: 'Opis', type: 'textarea', lp: 3, display: true },
      { name: 'isKop', label: 'KOP', type: 'input', lp: 4, display: true },
    ],
  },
  {
    name: 'zapytanie',
    label: 'Zapytanie',
    fields: [
      { name: 'sqlQuery', label: 'Zapytanie SQL', type: 'input', lp: 1, display: true },
      { name: 'parameters', label: 'Parametry', type: 'input', lp: 2, display: true },
    ],
  },
  {
    name: 'uprawnienia',
    label: 'Uprawnienia',
    fields: [
      { name: 'permissionIds', label: 'Uprawnienia', type: 'input', lp: 1, display: true },
    ],
  },
]

export async function GET() {
  // TODO: proxy to backend /reports/wizard/mapping
  return NextResponse.json(mapping)
}
