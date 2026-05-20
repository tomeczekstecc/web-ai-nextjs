export type TaskPriority = "low" | "normal" | "high";

export type TaskListItem = {
  id: number;
  title: string;
  type: string;
  priority: TaskPriority;
  deadline: string;
};

export type TaskListResponse = TaskListItem[];
