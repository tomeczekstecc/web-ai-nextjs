import "server-only";

type AuthAuditEvent = {
  event: string;
  path: string;
  status?: string | number | null;
  email?: string | null;
  provider?: string | null;
  ip?: string | null;
  detail?: string | null;
};

export function logAuthAudit(event: AuthAuditEvent) {
  console.info(
    "[auth-audit]",
    JSON.stringify({
      timestamp: new Date().toISOString(),
      ...event,
    }),
  );
}
