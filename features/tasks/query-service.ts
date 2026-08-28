import type { VerifiedUser } from "@/lib/auth/types";
import type {
  AssignableUser,
  TaskFilters,
  TaskRecord,
} from "@/features/tasks/types";

type Dependencies = {
  getVerifiedUser: () => Promise<VerifiedUser>;
  list: (filters?: TaskFilters) => Promise<TaskRecord[]>;
  listAssignees?: () => Promise<AssignableUser[]>;
};

export function makeTaskQueries(dependencies: Dependencies) {
  return {
    async listTasks(filters: TaskFilters = {}) {
      await dependencies.getVerifiedUser();
      return dependencies.list(filters);
    },

    async getTaskBoardData(filters: TaskFilters = {}) {
      const currentUser = await dependencies.getVerifiedUser();
      const [tasks, assignees] = await Promise.all([
        dependencies.list(filters),
        dependencies.listAssignees?.() ?? Promise.resolve([]),
      ]);
      return { currentUser, tasks, assignees };
    },
  };
}
