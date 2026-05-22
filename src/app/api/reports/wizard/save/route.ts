import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const body = await request.json() as Record<string, unknown>
  // TODO: proxy to backend /reports/wizard/save
  const id = (body.id as number | undefined) ?? Date.now()
  return NextResponse.json({ id })
}
