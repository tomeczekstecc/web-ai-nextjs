import type {
  LaravelAppUser,
  LaravelAppUserPayload,
} from "@/lib/api/domains/auth-user/contract";

export function mapLaravelAppUser(payload: LaravelAppUserPayload): LaravelAppUser {
  return {
    id: payload.id,
    email: payload.email,
    displayName: payload.display_name,
    avatarUrl: payload.avatar_url ?? null,
    accessState: payload.access_state,
    roles: payload.roles,
    permissions: payload.permissions,
    organizationName: payload.organization_name ?? null,
  };
}
