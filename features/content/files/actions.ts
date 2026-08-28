import { revalidatePath } from "next/cache";

import {
  makeContentFileActions,
  type ContentFileMeta,
} from "@/features/content/files/service";
import { contentRepository } from "@/features/content/repository";
import type { ContentAttachment } from "@/features/content/types";
import { getVerifiedUser } from "@/lib/auth/get-verified-user";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

const BUCKET = "content-files";

const fileActions = makeContentFileActions({
  getVerifiedUser,
  findContent: (contentId) => contentRepository.find(contentId),
  async createUploadUrl(storagePath) {
    const { data, error } = await getSupabaseAdmin()
      .storage.from(BUCKET)
      .createSignedUploadUrl(storagePath);
    if (error || !data) {
      throw new Error(`UPLOAD_LINK_FAILED:${error?.message ?? "NO_DATA"}`);
    }
    return { token: data.token };
  },
  async inspectUpload(storagePath) {
    const { data, error } = await getSupabaseAdmin()
      .storage.from(BUCKET)
      .info(storagePath);
    if (error || !data || !data.size || !data.contentType) return null;
    return { size: data.size, type: data.contentType };
  },
  async saveAttachment(input): Promise<ContentAttachment> {
    const { data, error } = await getSupabaseAdmin()
      .from("content_attachments")
      .insert({
        content_id: input.contentId,
        storage_path: input.storagePath,
        file_name: input.fileName,
        mime_type: input.mimeType,
        byte_size: input.byteSize,
        uploader_id: input.uploaderId,
      })
      .select("*")
      .single();
    if (error || !data) {
      throw new Error(`ATTACHMENT_SAVE_FAILED:${error?.message ?? "NO_DATA"}`);
    }
    return {
      id: data.id,
      contentId: data.content_id,
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

export async function requestUpload(
  contentId: string,
  fileMeta: ContentFileMeta
) {
  "use server";
  return fileActions.requestUpload(contentId, fileMeta);
}

export async function finishUpload(
  contentId: string,
  storagePath: string,
  fileMeta: ContentFileMeta
) {
  "use server";
  return fileActions.finishUpload(contentId, storagePath, fileMeta);
}
