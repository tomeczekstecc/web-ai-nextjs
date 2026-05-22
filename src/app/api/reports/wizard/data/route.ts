import { NextResponse } from 'next/server'

const defaultData = {
  status: 'projekt',
  name: '',
  description: '',
  isKop: false,
  sqlQuery: '',
  parameters: [],
  permissionIds: [],
}

export async function GET() {
  // TODO: proxy to backend /reports/wizard/data
  return NextResponse.json(defaultData)
}
