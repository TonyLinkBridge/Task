import { taskRepository } from "@/features/tasks/repository";
import { makeTaskQueries } from "@/features/tasks/query-service";
import type { TaskFilters } from "@/features/tasks/types";
import { getVerifiedUser } from "@/lib/auth/get-verified-user";

const taskQueries = makeTaskQueries({
  getVerifiedUser,
  list: (filters) => taskRepository.list(filters),
  listAssignees: () => taskRepository.listAssignees(),
  getTask: (id) => taskRepository.get(id),
  listComments: (taskId) => taskRepository.listComments(taskId),
  listAttachments: (taskId) => taskRepository.listAttachments(taskId),
});

export async function listTasks(filters: TaskFilters = {}) {
  return taskQueries.listTasks(filters);
}

export async function getTaskBoardData(filters: TaskFilters = {}) {
  return taskQueries.getTaskBoardData(filters);
}

export async function getTaskDetailData(taskId: string) {
  return taskQueries.getTaskDetailData(taskId);
}
