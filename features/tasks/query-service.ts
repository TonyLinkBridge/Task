import type { VerifiedUser } from "@/lib/auth/types";
import type { TaskFilters } from "@/features/tasks/repository";
import type { TaskRecord } from "@/features/tasks/types";

type Dependencies = {
  getVerifiedUser: () => Promise<VerifiedUser>;
  list: (filters?: TaskFilters) => Promise<TaskRecord[]>;
};

export function makeTaskQueries(dependencies: Dependencies) {
  return {
    async listTasks(filters: TaskFilters = {}) {
      await dependencies.getVerifiedUser();
      return dependencies.list(filters);
    },
  };
}
