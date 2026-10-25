"use client";

import {ActionFeedback} from "@/components/feedback/action-feedback";
import Image from "next/image";
import { useRef, useState } from "react";

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
  type ContentFileMeta,
} from "@/features/content/files/service";
import type { ContentAttachment } from "@/features/content/types";
import { MediaPicker } from '@/features/media-library/components/picker';
import type { MediaAsset } from '@/features/media-library/types';
import { MediaUpload, uploadSignedFile } from "@/features/media-library/components/upload";

type RequestUploadResult =
  | { ok: true; data: { storagePath: string; token: string; signedUrl?: string } }
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
  presentation = "default",
  listMediaAction, useMediaAction,
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
  presentation?: "default" | "library";
  listMediaAction?: () => Promise<MediaAsset[]>;
  useMediaAction?: (assetId:string,contentId:string) => Promise<FinishUploadResult>;
}) {
  const [attachments, setAttachments] = useState(initialAttachments);
  const [previewAttachment, setPreviewAttachment] =
    useState<ContentAttachment | null>(null);
  const tickets = useRef(new WeakMap<File, {storagePath:string;signedUrl:string;transferred?:boolean}>());
  const [message, setMessage] = useState<string | null>(null);


  return (
    <section className={presentation === "library" ? "marketing-library-files" : "rounded-xl border bg-card p-5"}>
      {presentation !== "library" || editable ? <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-medium">文件</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            图片、影片、音频、PDF 或 Office 文件，最大 100MB
          </p>
        </div>

      </div> : null}

      {editable ? <div className="mt-4"><MediaUpload save={async(file,meta,options)=>{
        setMessage(null);
        try {
          let ticket=tickets.current.get(file);
          if(!ticket){
            const result=await requestUploadAction(contentId,meta);
            if(!result.ok)throw Error(result.message);
            if(!result.data.signedUrl)throw Error('上传连接未准备好，请重试。');
            ticket={storagePath:result.data.storagePath,signedUrl:result.data.signedUrl};
            tickets.current.set(file,ticket);
          }
          if(options.signal.aborted)throw new DOMException('已取消','AbortError');
          if(!ticket.transferred){try{await uploadSignedFile(ticket.signedUrl,file,options);ticket.transferred=true;}catch(e){tickets.current.delete(file);throw e;}}
          if(options.signal.aborted)throw new DOMException('已取消','AbortError');
          const result=await finishUploadAction(contentId,ticket.storagePath,meta);
          if(!result.ok)throw Error(result.message);
          setAttachments(all=>[...all.filter(a=>a.id!==result.data.id),result.data]);
          options.onProgress(100);
        } catch(e) {
          if(e instanceof Error && e.name==='AbortError')throw e;
          throw Error(e instanceof Error && !e.message.includes('Server Components') ? e.message : '服务器刚刚没有回应，请直接重试，不需要刷新页面。');
        }
      }}/></div> : null}

      {editable&&listMediaAction&&useMediaAction?<div className="mt-3"><MediaPicker contentId={contentId} listAction={listMediaAction} attachAction={useMediaAction} onAttached={file=>{setAttachments(all=>[...all.filter(a=>a.id!==file.id),file]);setMessage('素材已经加入内容。');}}/></div>:null}
      <div className="mt-4 space-y-2">
        {attachments.map((attachment) => {
          const canPreview = attachment.mimeType.startsWith("image/");
          const downloadHref = `/api/files/${attachment.id}?mode=download`;

          return (
            <div
              key={attachment.id}
              className={presentation === "library" ? "marketing-library-file" : "flex flex-wrap items-center justify-between gap-3 rounded-lg bg-muted/50 px-3 py-2"}
            >
              {canPreview && presentation === "library" ? <button type="button" className="marketing-file-thumbnail" aria-label={`预览图片 ${attachment.fileName}`} onClick={() => setPreviewAttachment(attachment)}><Image src={`/api/files/${attachment.id}?mode=preview`} alt="" width={640} height={360} sizes="(max-width:760px) 90vw, 280px" unoptimized /></button> : null}
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
                  {attachment.byteSize < 1024 * 1024 ? `${(attachment.byteSize / 1024).toFixed(1)} KB` : `${(attachment.byteSize / 1024 / 1024).toFixed(1)} MB`}
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
        <ActionFeedback message={message} type="success" className="mt-3 text-sm text-muted-foreground"/>
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
