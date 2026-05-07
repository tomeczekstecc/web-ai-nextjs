import "server-only";

import { apiRequest } from "@/lib/api/core/http";
import type { ApiResult } from "@/lib/api/contracts/common";
import type {
  Application,
  ApplicationPayload,
  CreateApplicationInput,
} from "@/lib/api/domains/applications/contract";
import { mapApplication } from "@/lib/api/domains/applications/mapper";

type ApplicationCommandResult = ApiResult<Application>;

export async function createApplication(
  input: CreateApplicationInput,
): Promise<ApplicationCommandResult> {
  const result = await apiRequest<ApplicationPayload, CreateApplicationInput>({
    path: "/api/applications",
    method: "POST",
    body: input,
  });

  if (!result.ok) {
    return result;
  }

  return {
    ok: true,
    status: result.status,
    data: mapApplication(result.data),
  };
}

export async function submitApplication(
  applicationId: string,
): Promise<ApplicationCommandResult> {
  const result = await apiRequest<ApplicationPayload>({
    path: `/api/applications/${applicationId}/submit`,
    method: "POST",
  });

  if (!result.ok) {
    return result;
  }

  return {
    ok: true,
    status: result.status,
    data: mapApplication(result.data),
  };
}
