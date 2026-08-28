import type { VerifiedUser } from "@/lib/auth/types";
import type {
  AssignableUser,
  TaskCommentView,
  TaskFilters,
  TaskRecord,
} from "@/features/tasks/types";

type Dependencies = {
  getVerifiedUser: () => Promise<VerifiedUser>;
  list: (filters?: TaskFilters) => Promise<TaskRecord[]>;
  listAssignees?: () => Promise<AssignableUser[]>;
  getTask?: (id: string) => Promise<TaskRecord | null>;
  listComments?: (taskId: string) => Promise<TaskCommentView[]>;
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

    async getTaskDetailData(taskId: string) {
      const currentUser = await dependencies.getVerifiedUser();
      const [task, comments, assignees] = await Promise.all([
        dependencies.getTask?.(taskId) ?? Promise.resolve(null),
        dependencies.listComments?.(taskId) ?? Promise.resolve([]),
        dependencies.listAssignees?.() ?? Promise.resolve([]),
      ]);
      return { currentUser, task, comments, assignees };
    },
  };
}
