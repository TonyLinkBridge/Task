import { z } from "zod";

import {
  buildStoragePath,
  fileSchema,
  type ContentFileMeta,
} from "@/features/content/files/service";
import type { TaskAttachment, TaskKind } from "@/features/tasks/types";
import type { VerifiedUser } from "@/lib/auth/types";

export type TaskFileMeta = ContentFileMeta;

type Dependencies = {
  getVerifiedUser: () => Promise<VerifiedUser>;
  findTask: (taskId: string) => Promise<{ id: string; kind: TaskKind } | null>;
  createUploadUrl: (storagePath: string) => Promise<{ token: string }>;
  inspectUpload: (
    storagePath: string
  ) => Promise<{ size: number; type: string } | null>;
  saveAttachment: (input: {
    taskId: string;
    storagePath: string;
    fileName: string;
    mimeType: string;
    byteSize: number;
    uploaderId: string;
  }) => Promise<TaskAttachment>;
  createId: () => string;
  revalidatePath: (path: string) => void;
};

const taskIdSchema = z.uuid();

export function makeTaskFileActions(dependencies: Dependencies) {
  async function findEditableTask(taskId: string) {
    const task = await dependencies.findTask(taskId);
    if (!task) {
      return { ok: false as const, message: "找不到这个任务。" };
    }
    if (task.kind === "content_publish") {
      return {
        ok: false as const,
        message: "发布任务的文件要在内容排期里管理。",
      };
    }
    return { ok: true as const, task };
  }

  return {
    async requestUpload(taskId: string, fileMeta: unknown) {
      await dependencies.getVerifiedUser();
      const parsedId = taskIdSchema.safeParse(taskId);
      const parsedFile = fileSchema.safeParse(fileMeta);
      if (!parsedId.success || !parsedFile.success) {
        return { ok: false as const, message: "这个文件不能上传。" };
      }

      const taskResult = await findEditableTask(parsedId.data);
      if (!taskResult.ok) return taskResult;

      try {
        const storagePath = buildStoragePath(
          parsedId.data,
          parsedFile.data.name,
          dependencies.createId()
        );
        const upload = await dependencies.createUploadUrl(storagePath);
        return {
          ok: true as const,
          data: { storagePath, token: upload.token },
        };
      } catch {
        return { ok: false as const, message: "暂时无法上传，请稍后再试。" };
      }
    },

    async finishUpload(taskId: string, storagePath: string, fileMeta: unknown) {
      const user = await dependencies.getVerifiedUser();
      const parsedId = taskIdSchema.safeParse(taskId);
      const parsedFile = fileSchema.safeParse(fileMeta);
      if (
        !parsedId.success ||
        !parsedFile.success ||
        !storagePath.startsWith(`${taskId}/`) ||
        storagePath.includes("..")
      ) {
        return { ok: false as const, message: "文件资料不正确。" };
      }

      const taskResult = await findEditableTask(parsedId.data);
      if (!taskResult.ok) return taskResult;

      try {
        const actualFile = await dependencies.inspectUpload(storagePath);
        const actualValidation = fileSchema.safeParse({
          name: parsedFile.data.name,
          type: actualFile?.type,
          size: actualFile?.size,
        });
        if (!actualFile || !actualValidation.success) {
          return { ok: false as const, message: "文件资料不正确。" };
        }

        const attachment = await dependencies.saveAttachment({
          taskId: parsedId.data,
          storagePath,
          fileName: parsedFile.data.name,
          mimeType: actualValidation.data.type,
          byteSize: actualValidation.data.size,
          uploaderId: user.id,
        });
        dependencies.revalidatePath(`/tasks/${parsedId.data}`);
        return { ok: true as const, data: attachment };
      } catch {
        return { ok: false as const, message: "暂时无法保存文件。" };
      }
    },
  };
}
