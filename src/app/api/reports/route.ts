import { NextResponse } from 'next/server'
import type { ReportListPayload } from '@/lib/api/domains/reports/contract'

const mockList: ReportListPayload = {
  items: [
    {
      id: 1,
      name: 'Raport miesięczny',
      status: 'aktywny',
      parameters: [
        { name: 'rok', type: 'numer', default_value: '2026', description: 'Rok sprawozdawczy' },
      ],
      created_at: '2026-01-15T10:00:00Z',
      updated_at: '2026-05-01T08:30:00Z',
    },
    {
      id: 2,
      name: 'Raport roczny',
      status: 'projekt',
      parameters: [],
      created_at: '2026-03-10T12:00:00Z',
      updated_at: '2026-04-20T09:00:00Z',
    },
    {
      id: 3,
      name: 'Zestawienie KOP',
      status: 'archiwum',
      parameters: [],
      created_at: '2025-12-01T08:00:00Z',
      updated_at: '2026-01-10T10:00:00Z',
    },
  ],
  page: 1,
  pageSize: 10,
  totalItems: 3,
  totalPages: 1,
}

export async function GET(request: Request) {
  // TODO: proxy to backend /reports with query params
  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search')?.toLowerCase() ?? ''
  const items = search
    ? mockList.items.filter(r => r.name.toLowerCase().includes(search))
    : mockList.items
  return NextResponse.json({ ...mockList, items, totalItems: items.length })
}
