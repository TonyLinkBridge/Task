import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";

import { AppSidebar } from "@/components/app-shell/app-sidebar";
import { ContentHeader } from "@/components/app-shell/content-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { SidebarProvider } from "@/components/ui/sidebar";
import { ReviewHistory } from "@/features/approval/components/review-history";
import { approvalRepository } from "@/features/approval/repository";
import { addContentComment } from "@/features/content/actions/comments";
import { Attachments } from "@/features/content/components/attachments";
import { ContentChat } from "@/features/content/components/content-chat";
import { ContentEditorReview } from "@/features/content/components/content-editor-review";
import { ContentRoom } from "@/features/content/components/content-room";
import { finishUpload, requestUpload } from "@/features/content/files/actions";
import { contentRepository } from "@/features/content/repository";
import { taskRepository } from "@/features/tasks/repository";
import { getVerifiedUser } from "@/lib/auth/get-verified-user";

const statusLabels = {
  draft: "草稿",
  in_review: "等待审核",
  changes_requested: "需要修改",
  approved: "已经批准",
  due: "等待发布",
  published: "已经发布",
  archived: "已经收起",
} as const;

const timeFormatter = new Intl.DateTimeFormat("zh-MY", {
  timeZone: "Asia/Kuala_Lumpur",
  dateStyle: "long",
  timeStyle: "short",
});

export default async function ContentDetailPage({
  params,
}: {
  params: Promise<{ contentId: string }>;
}) {
  const { contentId } = await params;
  if (!z.uuid().safeParse(contentId).success) notFound();

  const content = await contentRepository.find(contentId);
  if (!content) notFound();

  const [
    currentUser,
    approvals,
    history,
    comments,
    attachments,
    platforms,
    platformIds,
    assignees,
  ] = await Promise.all([
    getVerifiedUser(),
    approvalRepository.listApprovals(contentId),
    approvalRepository.listHistory(contentId),
    contentRepository.listComments(contentId),
    contentRepository.listAttachments(contentId),
    contentRepository.listPlatforms(),
    contentRepository.listPlatformIds(contentId),
    taskRepository.listAssignees(),
  ]);
  const contentPlatforms = platforms.filter(({ id }) => platformIds.includes(id));
  const assignee = assignees.find(({ id }) => id === content.assigneeId);
  const admins = assignees.filter(({ role }) => role === "admin");

  return (
    <SidebarProvider>
      <AppSidebar currentUser={currentUser} />
      <div className="flex h-screen flex-1 flex-col overflow-hidden">
        <ContentHeader currentUser={currentUser} />
        <main className="flex-1 overflow-auto p-4 sm:p-6">
          <div className="mx-auto max-w-6xl space-y-5">
            <Link href="/content" className={buttonVariants({ variant: "ghost" })}>
              ← 返回内容排期
            </Link>

            <section className="rounded-xl border bg-card p-5 sm:p-6">
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{statusLabels[content.status]}</Badge>
                {contentPlatforms.map((platform) => (
                  <Badge key={platform.id} variant="outline">
                    <span className="size-2 rounded-full" style={{ backgroundColor: platform.color }} />
                    {platform.name}
                  </Badge>
                ))}
              </div>
              <h1 className="mt-4 text-2xl font-semibold">{content.title}</h1>
              <dl className="mt-6 grid gap-4 border-t pt-5 sm:grid-cols-2">
                <div>
                  <dt className="text-xs text-muted-foreground">负责人</dt>
                  <dd className="mt-1 text-sm font-medium">{assignee?.name ?? "未找到负责人"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">发布时间</dt>
                  <dd className="mt-1 text-sm font-medium">
                    {timeFormatter.format(new Date(content.publishAt))}
                  </dd>
                </div>
              </dl>
            </section>

            <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]">
              <div className="space-y-5">
                <ContentRoom contentId={content.id}>
                  <ContentEditorReview
                    content={content}
                    approvals={approvals}
                    currentUser={currentUser}
                    admins={admins}
                  />
                </ContentRoom>
                <ContentChat
                  contentId={content.id}
                  comments={comments}
                  currentUser={currentUser}
                  addCommentAction={addContentComment}
                />
              </div>
              <div className="space-y-5">
                <Attachments
                  contentId={content.id}
                  attachments={attachments}
                  requestUploadAction={requestUpload}
                  finishUploadAction={finishUpload}
                />
                <ReviewHistory events={history} />
              </div>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
