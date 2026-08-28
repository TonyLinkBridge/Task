import type { TaskRecord, TaskStatus } from "@/features/tasks/types";

export function groupTasksByStatus(
  tasks: TaskRecord[]
): Record<TaskStatus, TaskRecord[]> {
  const grouped: Record<TaskStatus, TaskRecord[]> = {
    todo: [],
    in_progress: [],
    review: [],
    done: [],
  };

  for (const task of tasks) {
    grouped[task.status].push(task);
  }

  for (const column of Object.values(grouped)) {
    column.sort((left, right) => left.position - right.position);
  }

  return grouped;
}
