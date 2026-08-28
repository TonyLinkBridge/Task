import { taskRepository } from "@/features/tasks/repository";
import { makeTaskQueries } from "@/features/tasks/query-service";
import type { TaskFilters } from "@/features/tasks/repository";
import { getVerifiedUser } from "@/lib/auth/get-verified-user";

const taskQueries = makeTaskQueries({
  getVerifiedUser,
  list: (filters) => taskRepository.list(filters),
});

export async function listTasks(filters: TaskFilters = {}) {
  return taskQueries.listTasks(filters);
}
