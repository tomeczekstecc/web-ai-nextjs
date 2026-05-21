import { queryOptions } from "@tanstack/react-query";

import { fetchTaskList } from "./client";
import { tasksKeys } from "./query-keys";

export function taskListOptions() {
  return queryOptions({
    queryKey: tasksKeys.list(),
    queryFn: fetchTaskList,
    staleTime: 30 * 1000,
  });
}
