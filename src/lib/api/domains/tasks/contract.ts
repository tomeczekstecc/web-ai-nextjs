export type TaskPriority = "low" | "normal" | "high";

export type TaskListItem = {
  id: number;
  title: string;
  type: string;
  priority: TaskPriority;
  deadline: string;
  /** ISO 8601 timestamp of the last modification. */
  updatedAt: string;
};

export type TaskListResponse = TaskListItem[];
