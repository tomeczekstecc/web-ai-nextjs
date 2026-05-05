import { NextResponse } from "next/server";

import { authPool } from "@/lib/auth";

type RevokeRequestBody = {
  email?: string;
  reason?: string;
};

export async function POST(request: Request) {
  const internalToken = request.headers.get("X-Internal-Auth-Revoke");

  if (
    !internalToken ||
    internalToken !== process.env.LARAVEL_INTERNAL_AUTH_REVOKE_TOKEN
  ) {
    return NextResponse.json(
      { message: "Nieprawidlowe wewnetrzne uwierzytelnienie." },
      { status: 401 },
    );
  }

  const body = (await request.json()) as RevokeRequestBody;

  if (!body.email) {
    return NextResponse.json(
      { message: "Adres e-mail jest wymagany." },
      { status: 400 },
    );
  }

  const userResult = await authPool.query<{ id: string }>(
    "select id from auth_users where email = $1 limit 1",
    [body.email],
  );

  if (userResult.rows.length === 0) {
    return NextResponse.json({ revoked: 0 }, { status: 200 });
  }

  const userId = userResult.rows[0]?.id;
  const revokeResult = await authPool.query(
    "delete from auth_sessions where user_id = $1",
    [userId],
  );

  return NextResponse.json(
    {
      revoked: revokeResult.rowCount ?? 0,
      reason: body.reason ?? null,
    },
    { status: 200 },
  );
}
