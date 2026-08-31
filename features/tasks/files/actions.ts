import { revalidatePath } from "next/cache";

import {
  makeTaskFileActions,
  type TaskFileMeta,
} from "@/features/tasks/files/service";
import { taskRepository } from "@/features/tasks/repository";
import type { TaskAttachment } from "@/features/tasks/types";
import { getVerifiedUser } from "@/lib/auth/get-verified-user";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

const BUCKET = "task-files";

const taskFileActions = makeTaskFileActions({
  getVerifiedUser,
  findTask: (taskId) => taskRepository.get(taskId),
  async createUploadUrl(storagePath) {
    const { data, error } = await getSupabaseAdmin()
      .storage.from(BUCKET)
      .createSignedUploadUrl(storagePath);
    if (error || !data) throw new Error("TASK_UPLOAD_LINK_FAILED");
    return { token: data.token };
  },
  async inspectUpload(storagePath) {
    const { data, error } = await getSupabaseAdmin()
      .storage.from(BUCKET)
      .info(storagePath);
    if (error || !data || !data.size || !data.contentType) return null;
    return { size: data.size, type: data.contentType };
  },
  async saveAttachment(input): Promise<TaskAttachment> {
    const { data, error } = await getSupabaseAdmin()
      .from("task_attachments")
      .insert({
        task_id: input.taskId,
        storage_path: input.storagePath,
        file_name: input.fileName,
        mime_type: input.mimeType,
        byte_size: input.byteSize,
        uploader_id: input.uploaderId,
      })
      .select("*")
      .single();
    if (error || !data) throw new Error("TASK_ATTACHMENT_SAVE_FAILED");
    return {
      id: data.id,
      taskId: data.task_id,
      storagePath: data.storage_path,
      fileName: data.file_name,
      mimeType: data.mime_type,
      byteSize: Number(data.byte_size),
      uploaderId: data.uploader_id,
      createdAt: data.created_at,
    };
  },
  createId: () => crypto.randomUUID(),
  revalidatePath,
});

export async function requestTaskUpload(taskId: string, fileMeta: TaskFileMeta) {
  "use server";
  return taskFileActions.requestUpload(taskId, fileMeta);
}

export async function finishTaskUpload(
  taskId: string,
  storagePath: string,
  fileMeta: TaskFileMeta
) {
  "use server";
  return taskFileActions.finishUpload(taskId, storagePath, fileMeta);
}
