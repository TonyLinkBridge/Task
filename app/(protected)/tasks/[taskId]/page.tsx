import {hasPermission} from "@/features/team/permissions";
import "@/features/marketing/marketing.css";
import { MarketingShell } from "@/features/marketing/components/shell";
import { MarketingRouteTransition } from "@/features/marketing/components/route-transition";
import { z } from "zod";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { ArchiveTaskButton } from "@/features/tasks/components/archive-task-button";
import { DeleteTaskButton } from "@/features/tasks/components/delete-task-button";
import { TaskComments } from "@/features/tasks/components/task-comments";
import { TaskAttachments } from "@/features/tasks/components/task-attachments";
import { TaskForm } from "@/features/tasks/components/task-form";
import {
  finishTaskUpload,
  requestTaskUpload,
} from "@/features/tasks/files/actions";
import {
  addTaskComment,
  archiveTask,
  deleteTask,
  updateTask,
} from "@/features/tasks/actions";
import { getTaskDetailData } from "@/features/tasks/queries";

const statusLabels = {
  draft: "草稿",
  todo: "还没开始",
  in_progress: "正在做",
  review: "等人检查",
  done: "已经完成",
} as const;

const priorityLabels = {
  low: "普通",
  medium: "重要",
  urgent: "紧急",
} as const;

const timeFormatter = new Intl.DateTimeFormat("zh-MY", {
  timeZone: "Asia/Kuala_Lumpur",
  dateStyle: "long",
  timeStyle: "short",
});

type TaskDetailPageProps = {
  params: Promise<{ taskId: string }>;
};

export default async function TaskDetailPage({ params }: TaskDetailPageProps) {
  const { taskId } = await params;
  if (!z.uuid().safeParse(taskId).success) notFound();

  const { task, comments, attachments, currentUser, assignees } =
    await getTaskDetailData(taskId);
  if (!task) notFound();

  const taskAssignees = assignees.filter(({ id }) =>
    (task.assigneeIds ?? [task.assigneeId]).includes(id)
  );

  return (
    <MarketingRouteTransition>
      <MarketingShell currentUser={currentUser} active="tasks" title={task.title} description="查看任务资料、文件和留言。">
        <div className="marketing-task-detail marketing-entry">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Link href="/marketing/tasks" className={buttonVariants({ variant: "ghost" })}>
                ← 返回任务看板
              </Link>
              <div className="flex items-center gap-2">
                {task.kind === "general" ? (
                  <TaskForm
                    assignees={assignees}
                    initialTask={task}
                    updateTaskAction={updateTask}
                  />
                ) : task.linkedContentId ? (
                  <Link
                    href={`/marketing/content/${task.linkedContentId}`}
                    className={buttonVariants({ variant: "outline" })}
                  >
                    打开排期内容
                  </Link>
                ) : null}
                <ArchiveTaskButton
                  taskId={task.id}
                  taskKind={task.kind}
                  archiveTaskAction={archiveTask}
                  redirectTo="/marketing/tasks"
                />
                {task.kind === "general" &&
                (hasPermission(currentUser,"tasks.manage_all") ||
                  task.creatorId === currentUser.id) ? (
                  <DeleteTaskButton
                    taskId={task.id}
                    deleteTaskAction={deleteTask}
                    redirectTo="/marketing/tasks"
                  />
                ) : null}
              </div>
            </div>

            <section aria-label="任务资料" className="rounded-xl border bg-card p-5 sm:p-6">
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{statusLabels[task.status]}</Badge>
                <Badge variant="outline">{priorityLabels[task.priority]}</Badge>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
                {task.description || "没有填写说明。"}
              </p>

              <dl className="mt-6 grid gap-4 border-t pt-5 sm:grid-cols-2">
                <div>
                  <dt className="text-xs text-muted-foreground">项目／分类</dt>
                  <dd className="mt-1 text-sm font-medium">{task.project}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">负责人</dt>
                  <dd className="mt-1 text-sm font-medium">
                    {taskAssignees.length
                      ? taskAssignees.map(({ name }) => name).join("、")
                      : "未找到负责人"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">截止时间</dt>
                  <dd className="mt-1 text-sm font-medium">
                    {timeFormatter.format(new Date(task.dueAt))}
                  </dd>
                </div>
              </dl>
            </section>

            <TaskComments
              taskId={task.id}
              comments={comments}
              currentUser={currentUser}
              addCommentAction={addTaskComment}
            />
            {task.kind === "general" ? (
              <TaskAttachments
                taskId={task.id}
                attachments={attachments}
                requestUploadAction={requestTaskUpload}
                finishUploadAction={finishTaskUpload}
              />
            ) : null}
        </div>
      </MarketingShell>
    </MarketingRouteTransition>
  );
}
