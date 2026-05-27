import { NextResponse } from "next/server";

import { menuConfigFixture } from "@/mocks/data/menu";

/**
 * GET /api/config/menu
 *
 * Serves the menu configuration. In development with mock mode enabled
 * (AUTH_LARAVEL_MOCK_ENABLED=true) this returns the local fixture so the
 * sidebar works without a running Laravel backend.
 *
 * In production the request is proxied to the Laravel API by the server-side
 * fetch layer — this route should never be reached.
 */
export async function GET() {
  return NextResponse.json(menuConfigFixture);
}
