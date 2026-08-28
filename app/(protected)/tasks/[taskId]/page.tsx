import { z } from "zod";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AppSidebar } from "@/components/app-shell/app-sidebar";
import { TasksHeader } from "@/components/tasks/header/tasks-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { SidebarProvider } from "@/components/ui/sidebar";
import { ArchiveTaskButton } from "@/features/tasks/components/archive-task-button";
import { TaskComments } from "@/features/tasks/components/task-comments";
import { TaskForm } from "@/features/tasks/components/task-form";
import {
  addTaskComment,
  archiveTask,
  updateTask,
} from "@/features/tasks/actions";
import { getTaskDetailData } from "@/features/tasks/queries";

const statusLabels = {
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

  const { task, comments, currentUser, assignees } =
    await getTaskDetailData(taskId);
  if (!task) notFound();

  const assignee = assignees.find(({ id }) => id === task.assigneeId);

  return (
    <SidebarProvider>
      <AppSidebar currentUser={currentUser} />
      <div className="flex h-screen flex-1 flex-col overflow-hidden">
        <TasksHeader currentUser={currentUser} />
        <main className="flex-1 overflow-auto p-4 sm:p-6">
          <div className="mx-auto max-w-4xl space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Link href="/tasks" className={buttonVariants({ variant: "ghost" })}>
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
                    href={`/content/${task.linkedContentId}`}
                    className={buttonVariants({ variant: "outline" })}
                  >
                    打开排期内容
                  </Link>
                ) : null}
                <ArchiveTaskButton
                  taskId={task.id}
                  taskKind={task.kind}
                  archiveTaskAction={archiveTask}
                />
              </div>
            </div>

            <section className="rounded-xl border bg-card p-5 sm:p-6">
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{statusLabels[task.status]}</Badge>
                <Badge variant="outline">{priorityLabels[task.priority]}</Badge>
              </div>
              <h1 className="mt-4 text-2xl font-semibold">{task.title}</h1>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
                {task.description || "没有填写说明。"}
              </p>

              <dl className="mt-6 grid gap-4 border-t pt-5 sm:grid-cols-2">
                <div>
                  <dt className="text-xs text-muted-foreground">负责人</dt>
                  <dd className="mt-1 text-sm font-medium">
                    {assignee?.name ?? "未找到负责人"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">完成时间</dt>
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
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
