import { NextResponse } from 'next/server'
import type { Permission } from '@/lib/api/domains/reports/contract'

const permissions: Permission[] = [
  { id: 1, label: 'Administrator' },
  { id: 2, label: 'Operator' },
  { id: 3, label: 'Użytkownik' },
  { id: 4, label: 'Audytor' },
]

export async function GET() {
  // TODO: proxy to backend /reports/permissions
  return NextResponse.json(permissions)
}
