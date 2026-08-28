import { z } from "zod";

import type { ContentAttachment } from "@/features/content/types";
import type { VerifiedUser } from "@/lib/auth/types";

const MAX_FILE_SIZE = 100 * 1024 * 1024;
const officeMimeTypes = new Set([
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
]);

function allowedMimeType(type: string) {
  return (
    type.startsWith("image/") ||
    type.startsWith("video/") ||
    type.startsWith("audio/") ||
    type === "application/pdf" ||
    officeMimeTypes.has(type)
  );
}

export const fileSchema = z.object({
  name: z.string().trim().min(1).max(255),
  type: z.string().trim().min(1).refine(allowedMimeType),
  size: z.number().int().positive().max(MAX_FILE_SIZE),
});

export type ContentFileMeta = z.infer<typeof fileSchema>;

function safeFileName(fileName: string) {
  const baseName = fileName.split(/[\\/]/).pop()?.trim() || "file";
  return (
    baseName
      .replace(/\s+/g, "-")
      .replace(/[^A-Za-z0-9._,'!&$@=;:+?()*-]+/g, "_")
      .replace(/^\.+/, "") || "file"
  );
}

export function buildStoragePath(
  contentId: string,
  fileName: string,
  uploadId: string
) {
  return `${contentId}/${uploadId}-${safeFileName(fileName)}`;
}

type Dependencies = {
  getVerifiedUser: () => Promise<VerifiedUser>;
  findContent: (contentId: string) => Promise<{ id: string } | null>;
  createUploadUrl: (storagePath: string) => Promise<{ token: string }>;
  inspectUpload: (
    storagePath: string
  ) => Promise<{ size: number; type: string } | null>;
  saveAttachment: (input: {
    contentId: string;
    storagePath: string;
    fileName: string;
    mimeType: string;
    byteSize: number;
    uploaderId: string;
  }) => Promise<ContentAttachment>;
  createId: () => string;
  revalidatePath: (path: string) => void;
};

const contentIdSchema = z.uuid();

export function makeContentFileActions(dependencies: Dependencies) {
  return {
    async requestUpload(contentId: string, fileMeta: unknown) {
      await dependencies.getVerifiedUser();
      const parsedId = contentIdSchema.safeParse(contentId);
      const parsedFile = fileSchema.safeParse(fileMeta);
      if (!parsedId.success || !parsedFile.success) {
        return { ok: false as const, message: "这个文件不能上传。" };
      }

      const content = await dependencies.findContent(parsedId.data);
      if (!content) {
        return { ok: false as const, message: "找不到这条内容。" };
      }

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

    async finishUpload(
      contentId: string,
      storagePath: string,
      fileMeta: unknown
    ) {
      const user = await dependencies.getVerifiedUser();
      const parsedId = contentIdSchema.safeParse(contentId);
      const parsedFile = fileSchema.safeParse(fileMeta);
      if (
        !parsedId.success ||
        !parsedFile.success ||
        !storagePath.startsWith(`${contentId}/`) ||
        storagePath.includes("..")
      ) {
        return { ok: false as const, message: "文件资料不正确。" };
      }

      const content = await dependencies.findContent(parsedId.data);
      if (!content) {
        return { ok: false as const, message: "找不到这条内容。" };
      }

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
          contentId: parsedId.data,
          storagePath,
          fileName: parsedFile.data.name,
          mimeType: actualValidation.data.type,
          byteSize: actualValidation.data.size,
          uploaderId: user.id,
        });
        dependencies.revalidatePath(`/content/${parsedId.data}`);
        return { ok: true as const, data: attachment };
      } catch {
        return { ok: false as const, message: "暂时无法保存文件。" };
      }
    },
  };
}
