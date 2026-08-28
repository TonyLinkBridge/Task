import Link from "next/link";

import { AppSidebar } from "@/components/app-shell/app-sidebar";
import { DashboardHeader } from "@/components/app-shell/dashboard-header";
import { Badge } from "@/components/ui/badge";
import { SidebarProvider } from "@/components/ui/sidebar";
import { toMalaysiaDateKey } from "@/features/schedule/date";
import { listScheduledContent } from "@/features/schedule/queries";
import { taskRepository } from "@/features/tasks/repository";
import { getVerifiedUser } from "@/lib/auth/get-verified-user";

const timeFormatter = new Intl.DateTimeFormat("zh-MY", {
  timeZone: "Asia/Kuala_Lumpur",
  dateStyle: "medium",
  timeStyle: "short",
});

function SummaryCard({
  title,
  empty,
  items,
}: {
  title: string;
  empty: string;
  items: { id: string; title: string; href: string; time: string }[];
}) {
  return (
    <section className="rounded-xl border bg-card p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-medium">{title}</h2>
        <Badge variant="secondary">{items.length}</Badge>
      </div>
      <div className="mt-4 space-y-2">
        {items.slice(0, 5).map((item) => (
          <Link key={item.id} href={item.href} className="block rounded-lg bg-muted/50 px-3 py-2.5 hover:bg-muted">
            <p className="text-sm font-medium">{item.title}</p>
            <p className="mt-1 text-xs text-muted-foreground">{item.time}</p>
          </Link>
        ))}
        {items.length === 0 ? <p className="py-4 text-center text-sm text-muted-foreground">{empty}</p> : null}
      </div>
    </section>
  );
}

export default async function DashboardPage() {
  const [currentUser, tasks, contents] = await Promise.all([
    getVerifiedUser(),
    taskRepository.list(),
    listScheduledContent(),
  ]);
  const now = new Date();
  const today = toMalaysiaDateKey(now.toISOString());
  const unfinishedTasks = tasks.filter(({ status }) => status !== "done");
  const todayTasks = unfinishedTasks.filter(({ dueAt }) => toMalaysiaDateKey(dueAt) === today);
  const overdueTasks = unfinishedTasks.filter(({ dueAt }) => dueAt < now.toISOString());
  const waitingReview = contents.filter(({ status }) => status === "in_review");
  const upcoming = contents.filter(({ status, publishAt }) => status === "approved" && publishAt > now.toISOString());
  const missedPublish = contents.filter(
    ({ status, publishAt }) =>
      status !== "published" && publishAt <= now.toISOString()
  );
  const taskItems = (items: typeof tasks) => items.map((task) => ({
    id: task.id,
    title: task.title,
    href: `/tasks/${task.id}`,
    time: timeFormatter.format(new Date(task.dueAt)),
  }));
  const contentItems = (items: typeof contents) => items.map((content) => ({
    id: content.id,
    title: content.title,
    href: `/content/${content.id}`,
    time: timeFormatter.format(new Date(content.publishAt)),
  }));

  return (
    <SidebarProvider>
      <AppSidebar currentUser={currentUser} />
      <div className="flex h-screen flex-1 flex-col overflow-hidden">
        <DashboardHeader currentUser={currentUser} />
        <main className="flex-1 overflow-auto p-4 sm:p-6">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-2xl font-semibold">你好，{currentUser.name}</h2>
            <p className="mt-1 text-sm text-muted-foreground">这里集中显示现在最需要处理的事情。</p>
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <SummaryCard title="今天要做的任务" empty="今天没有到期任务" items={taskItems(todayTasks)} />
              <SummaryCard title="已经过期的任务" empty="没有过期任务" items={taskItems(overdueTasks)} />
              <SummaryCard title="等待上司检查" empty="没有内容在等检查" items={contentItems(waitingReview)} />
              <SummaryCard title="最近准备发布" empty="没有即将发布的内容" items={contentItems(upcoming)} />
              <SummaryCard title="超过时间还没发布" empty="没有漏掉的发布内容" items={contentItems(missedPublish)} />
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
