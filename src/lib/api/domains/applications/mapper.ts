import type {
  Application,
  ApplicationPayload,
} from "@/lib/api/domains/applications/contract";

export function mapApplication(payload: ApplicationPayload): Application {
  return {
    id: payload.id,
    firstName: payload.first_name,
    lastName: payload.last_name,
    email: payload.email,
    status: payload.status,
    createdAt: payload.created_at,
  };
}
