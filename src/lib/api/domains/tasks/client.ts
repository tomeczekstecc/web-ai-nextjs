import { browserFetch } from "@/lib/api/core/browser-http";
import type { TaskListResponse } from "./contract";

export async function fetchTaskList(): Promise<TaskListResponse> {
  const result = await browserFetch<TaskListResponse>("/tasks/list");
  if (!result.ok) throw new Error(result.error.message);
  return result.data;
}
