"use client";

import Image from "next/image";
import { useState } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  fileSchema,
  type ContentFileMeta,
} from "@/features/content/files/service";
import type { ContentAttachment } from "@/features/content/types";
import { getSupabaseBrowser } from "@/lib/supabase/browser";

type RequestUploadResult =
  | { ok: true; data: { storagePath: string; token: string } }
  | { ok: false; message: string };
type FinishUploadResult =
  | { ok: true; data: ContentAttachment }
  | { ok: false; message: string };

const unavailable = async () => ({
  ok: false as const,
  message: "暂时无法上传，请稍后再试。",
});

export function Attachments({
  contentId,
  attachments: initialAttachments,
  requestUploadAction = unavailable,
  finishUploadAction = unavailable,
  editable = true,
}: {
  contentId: string;
  attachments: ContentAttachment[];
  requestUploadAction?: (
    contentId: string,
    fileMeta: ContentFileMeta
  ) => Promise<RequestUploadResult>;
  finishUploadAction?: (
    contentId: string,
    storagePath: string,
    fileMeta: ContentFileMeta
  ) => Promise<FinishUploadResult>;
  editable?: boolean;
}) {
  const [attachments, setAttachments] = useState(initialAttachments);
  const [previewAttachment, setPreviewAttachment] =
    useState<ContentAttachment | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    const parsed = fileSchema.safeParse({
      name: file.name,
      type: file.type,
      size: file.size,
    });
    if (!parsed.success) {
      setMessage("只可上传图片、影片、音频、PDF 或 Office 文件，最大 100MB。");
      return;
    }

    setIsUploading(true);
    setMessage(null);
    const request = await requestUploadAction(contentId, parsed.data);
    if (!request.ok) {
      setIsUploading(false);
      setMessage(request.message);
      return;
    }

    const { error } = await getSupabaseBrowser()
      .storage.from("content-files")
      .uploadToSignedUrl(request.data.storagePath, request.data.token, file, {
        contentType: file.type,
      });
    if (error) {
      setIsUploading(false);
      setMessage("上传失败，请再试一次。");
      return;
    }

    const finish = await finishUploadAction(
      contentId,
      request.data.storagePath,
      parsed.data
    );
    setIsUploading(false);
    if (!finish.ok) {
      setMessage(finish.message);
      return;
    }

    setAttachments((current) => [...current, finish.data]);
    setMessage("文件已经上传。");
  }

  return (
    <section className="rounded-xl border bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-medium">文件</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            图片、影片、音频、PDF 或 Office 文件，最大 100MB
          </p>
        </div>
        {editable ? (
          <label
            className={buttonVariants({
              className: isUploading ? "pointer-events-none opacity-50" : "cursor-pointer",
            })}
          >
            {isUploading ? "正在上传…" : "上传文件"}
            <input
              aria-label="上传文件"
              type="file"
              className="sr-only"
              accept="image/*,video/*,audio/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
              disabled={isUploading}
              onChange={(event) => void handleFile(event.target.files?.[0])}
            />
          </label>
        ) : null}
      </div>

      <div className="mt-4 space-y-2">
        {attachments.map((attachment) => {
          const canPreview = attachment.mimeType.startsWith("image/");
          const downloadHref = `/api/files/${attachment.id}?mode=download`;

          return (
            <div
              key={attachment.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-muted/50 px-3 py-2"
            >
              {canPreview ? (
                <button
                  type="button"
                  className="min-w-0 truncate text-left text-sm font-medium underline-offset-4 hover:underline"
                  aria-label={`打开 ${attachment.fileName} 预览`}
                  onClick={() => setPreviewAttachment(attachment)}
                >
                  {attachment.fileName}
                </button>
              ) : (
                <span className="min-w-0 truncate text-sm font-medium">
                  {attachment.fileName}
                </span>
              )}
              <div className="ml-auto flex shrink-0 items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {(attachment.byteSize / 1024 / 1024).toFixed(1)} MB
                </span>
                {canPreview ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    aria-label={`预览 ${attachment.fileName}`}
                    onClick={() => setPreviewAttachment(attachment)}
                  >
                    预览
                  </Button>
                ) : null}
                <a
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                  href={downloadHref}
                  aria-label={`下载 ${attachment.fileName}`}
                >
                  下载
                </a>
              </div>
            </div>
          );
        })}
        {attachments.length === 0 ? (
          <p className="py-3 text-center text-sm text-muted-foreground">
            还没有文件
          </p>
        ) : null}
      </div>
      {message ? (
        <p aria-live="polite" className="mt-3 text-sm text-muted-foreground">
          {message}
        </p>
      ) : null}

      <Dialog
        open={previewAttachment !== null}
        onOpenChange={(open) => {
          if (!open) setPreviewAttachment(null);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-hidden sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>{previewAttachment?.fileName ?? "照片预览"}</DialogTitle>
            <DialogDescription>
              先查看照片，需要保存时再点击下载原图。
            </DialogDescription>
          </DialogHeader>
          {previewAttachment ? (
            <div className="flex max-h-[65vh] items-center justify-center overflow-auto rounded-lg bg-muted/50 p-2">
              <Image
                unoptimized
                src={`/api/files/${previewAttachment.id}?mode=preview`}
                alt={`${previewAttachment.fileName} 预览`}
                width={1600}
                height={1200}
                className="h-auto max-h-[62vh] w-auto max-w-full object-contain"
              />
            </div>
          ) : null}
          <DialogFooter showCloseButton>
            {previewAttachment ? (
              <a
                className={buttonVariants()}
                href={`/api/files/${previewAttachment.id}?mode=download`}
                aria-label={`下载 ${previewAttachment.fileName}`}
              >
                下载原图
              </a>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
