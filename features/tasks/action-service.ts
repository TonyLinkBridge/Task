import type { VerifiedUser } from "@/lib/auth/types";
import type { TaskInput } from "@/features/tasks/schema";
import { taskInputSchema } from "@/features/tasks/schema";
import { TASK_STATUSES } from "@/features/tasks/types";
import type {
  TaskCommentRecord,
  TaskRecord,
  TaskStatus,
} from "@/features/tasks/types";
import { z } from "zod";

export type { TaskCommentRecord } from "@/features/tasks/types";

export type TaskActionRepository = {
  create(input: TaskInput, creatorId: string): Promise<TaskRecord>;
  update(id: string, input: TaskInput): Promise<TaskRecord>;
  move(id: string, status: TaskStatus, position: number): Promise<TaskRecord>;
  archive(id: string, archivedAt: string): Promise<TaskRecord>;
  addComment(
    taskId: string,
    body: string,
    authorId: string
  ): Promise<TaskCommentRecord>;
};

type Dependencies = {
  getVerifiedUser: () => Promise<VerifiedUser>;
  repository: TaskActionRepository;
  now: () => Date;
  revalidatePath: (path: string) => void;
};

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; message: string };

const taskIdSchema = z.uuid();
const moveTaskSchema = z.object({
  id: taskIdSchema,
  status: z.enum(TASK_STATUSES),
  position: z.number().finite().nonnegative(),
});
const commentSchema = z.object({
  taskId: taskIdSchema,
  body: z.string().trim().min(1).max(5000),
});

export function makeTaskActions(dependencies: Dependencies) {
  async function save<T>(operation: () => Promise<T>): Promise<ActionResult<T>> {
    try {
      const data = await operation();
      dependencies.revalidatePath("/tasks");
      return { ok: true, data };
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === "CONTENT_PUBLISH_TASK_CANNOT_ARCHIVE"
      ) {
        return {
          ok: false,
          message: "发布任务要从内容排期里处理，不能在这里收起。",
        };
      }
      return { ok: false, message: "暂时无法保存，请稍后再试。" };
    }
  }

  return {
    async createTask(input: unknown): Promise<ActionResult<TaskRecord>> {
      const user = await dependencies.getVerifiedUser();
      const parsed = taskInputSchema.safeParse(input);
      if (!parsed.success) {
        return { ok: false, message: "请检查任务内容。" };
      }

      return save(() => dependencies.repository.create(parsed.data, user.id));
    },

    async updateTask(
      id: string,
      input: unknown
    ): Promise<ActionResult<TaskRecord>> {
      await dependencies.getVerifiedUser();
      const parsedId = taskIdSchema.safeParse(id);
      const parsedInput = taskInputSchema.safeParse(input);
      if (!parsedId.success || !parsedInput.success) {
        return { ok: false, message: "请检查任务内容。" };
      }

      return save(() =>
        dependencies.repository.update(parsedId.data, parsedInput.data)
      );
    },

    async moveTask(
      id: string,
      status: TaskStatus,
      position: number
    ): Promise<ActionResult<TaskRecord>> {
      await dependencies.getVerifiedUser();
      const parsed = moveTaskSchema.safeParse({ id, status, position });
      if (!parsed.success) {
        return { ok: false, message: "无法移动这个任务。" };
      }

      return save(() =>
        dependencies.repository.move(
          parsed.data.id,
          parsed.data.status,
          parsed.data.position
        )
      );
    },

    async archiveTask(id: string): Promise<ActionResult<TaskRecord>> {
      await dependencies.getVerifiedUser();
      const parsedId = taskIdSchema.safeParse(id);
      if (!parsedId.success) {
        return { ok: false, message: "找不到这个任务。" };
      }

      return save(() =>
        dependencies.repository.archive(
          parsedId.data,
          dependencies.now().toISOString()
        )
      );
    },

    async addTaskComment(
      taskId: string,
      body: string
    ): Promise<ActionResult<TaskCommentRecord>> {
      const user = await dependencies.getVerifiedUser();
      const parsed = commentSchema.safeParse({ taskId, body });
      if (!parsed.success) {
        return { ok: false, message: "留言不能为空。" };
      }

      return save(() =>
        dependencies.repository.addComment(
          parsed.data.taskId,
          parsed.data.body,
          user.id
        )
      );
    },
  };
}
