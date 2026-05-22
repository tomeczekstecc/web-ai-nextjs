import { NextResponse } from 'next/server'

const mockReports: Record<string, Record<string, unknown>> = {
  '1': {
    id: 1,
    status: 'aktywny',
    name: 'Raport miesięczny',
    description: 'Zestawienie danych za bieżący miesiąc.',
    isKop: false,
    sqlQuery: 'SELECT * FROM wnioski WHERE rok = {{rok}}',
    parameters: [
      { name: 'rok', type: 'numer', default_value: '2026', description: 'Rok sprawozdawczy' },
    ],
    permissionIds: [1, 2],
  },
  '2': {
    id: 2,
    status: 'projekt',
    name: 'Raport roczny',
    description: 'Podsumowanie działań za cały rok.',
    isKop: true,
    sqlQuery: 'SELECT * FROM wnioski',
    parameters: [],
    permissionIds: [],
  },
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  // TODO: proxy to backend /reports/wizard/data/:id
  const data = mockReports[id] ?? { ...mockReports['1'], id: Number(id) }
  return NextResponse.json(data)
}
