import { NextResponse } from "next/server";

import type { UpdateDashboardReviewItemInput } from "@/lib/api/domains/dashboard/contract";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = (await request.json()) as UpdateDashboardReviewItemInput;
  // TODO: persist to backend
  const updated = { id: Number(id), ...body };
  return NextResponse.json(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  // TODO: persist to backend
  void id;
  return new NextResponse(null, { status: 204 });
}
