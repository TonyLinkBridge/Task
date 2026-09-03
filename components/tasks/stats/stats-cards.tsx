import { HugeiconsIcon } from "@hugeicons/react";
import {
  Note01Icon,
  Notebook01Icon,
  TaskDaily01Icon,
  FireIcon,
} from "@hugeicons/core-free-icons";

import type { TaskRecord } from "@/features/tasks/types";

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: number;
  description: string;
}

const MALAYSIA_OFFSET_MS = 8 * 60 * 60 * 1000;

function malaysiaDateKey(value: Date | string) {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Date(date.getTime() + MALAYSIA_OFFSET_MS)
    .toISOString()
    .slice(0, 10);
}

function malaysiaMonthKey(value: Date | string) {
  return malaysiaDateKey(value).slice(0, 7);
}

function previousMalaysiaMonthKey(now: Date) {
  const malaysiaNow = new Date(now.getTime() + MALAYSIA_OFFSET_MS);
  return new Date(
    Date.UTC(malaysiaNow.getUTCFullYear(), malaysiaNow.getUTCMonth() - 1, 1)
  )
    .toISOString()
    .slice(0, 7);
}

function malaysiaWeekStart(now: Date) {
  const malaysiaNow = new Date(now.getTime() + MALAYSIA_OFFSET_MS);
  const dayFromMonday = (malaysiaNow.getUTCDay() + 6) % 7;
  return (
    Date.UTC(
      malaysiaNow.getUTCFullYear(),
      malaysiaNow.getUTCMonth(),
      malaysiaNow.getUTCDate() - dayFromMonday
    ) - MALAYSIA_OFFSET_MS
  );
}

export function getTaskStats(tasks: TaskRecord[], now = new Date()) {
  const today = malaysiaDateKey(now);
  const nowTime = now.getTime();
  const weekStart = malaysiaWeekStart(now);

  return {
    dueToday: tasks.filter(
      (task) => task.status !== "done" && malaysiaDateKey(task.dueAt) === today
    ).length,
    overdue: tasks.filter(
      (task) =>
        task.status !== "done" &&
        new Date(task.dueAt).getTime() < nowTime &&
        malaysiaDateKey(task.dueAt) < today
    ).length,
    inProgress: tasks.filter((task) => task.status === "in_progress").length,
    completedThisWeek: tasks.filter((task) => {
      const completedAt = new Date(task.updatedAt).getTime();
      return task.status === "done" && completedAt >= weekStart && completedAt <= nowTime;
    }).length,
  };
}

export function getMonthlyTaskComparison(
  tasks: TaskRecord[],
  now = new Date()
) {
  const currentMonth = malaysiaMonthKey(now);
  const previousMonth = previousMalaysiaMonthKey(now);

  return {
    created: {
      current: tasks.filter(
        (task) => malaysiaMonthKey(task.createdAt) === currentMonth
      ).length,
      previous: tasks.filter(
        (task) => malaysiaMonthKey(task.createdAt) === previousMonth
      ).length,
    },
    completed: {
      current: tasks.filter(
        (task) =>
          task.status === "done" &&
          malaysiaMonthKey(task.updatedAt) === currentMonth
      ).length,
      previous: tasks.filter(
        (task) =>
          task.status === "done" &&
          malaysiaMonthKey(task.updatedAt) === previousMonth
      ).length,
    },
  };
}

function comparisonText(current: number, previous: number) {
  const difference = current - previous;
  if (difference > 0) return `比上个月多 ${difference} 项`;
  if (difference < 0) return `比上个月少 ${Math.abs(difference)} 项`;
  return "和上个月一样";
}

function StatCard({ icon, title, value, description }: StatCardProps) {
  return (
    <article aria-label={title} className="min-w-0 rounded-xl border bg-card p-4 sm:p-5">
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="text-xs text-muted-foreground">{title}</span>
      </div>
      <p data-testid="task-stat-value" className="mt-3 text-3xl font-bold">{value}</p>
      <p className="mt-2 text-xs text-muted-foreground">{description}</p>
    </article>
  );
}

export function StatsCards({ tasks, now }: { tasks: TaskRecord[]; now?: Date }) {
  const stats = getTaskStats(tasks, now);
  const comparison = getMonthlyTaskComparison(tasks, now);

  return (
    <>
      <div className="grid gap-3 px-4 sm:grid-cols-2 sm:px-6 xl:grid-cols-4">
        <StatCard
          icon={<HugeiconsIcon icon={Note01Icon} className="size-[18px] text-muted-foreground" />}
          title="今天到期"
          value={stats.dueToday}
          description="今天需要处理完的任务"
        />
        <StatCard
          icon={<HugeiconsIcon icon={Notebook01Icon} className="size-[18px] text-muted-foreground" />}
          title="已经逾期"
          value={stats.overdue}
          description="到期日早于今天、仍未完成"
        />
        <StatCard
          icon={<HugeiconsIcon icon={TaskDaily01Icon} className="size-[18px] text-muted-foreground" />}
          title="正在处理"
          value={stats.inProgress}
          description="目前放在“正在做”的任务"
        />
        <StatCard
          icon={<HugeiconsIcon icon={FireIcon} className="size-[18px] text-muted-foreground" />}
          title="本周完成"
          value={stats.completedThisWeek}
          description="本周一至现在完成的任务"
        />
      </div>

      <section className="px-4 sm:px-6" aria-label="本月与上月比较">
        <div className="grid gap-3 sm:grid-cols-2">
          <article
            aria-label="每月新增任务比较"
            className="rounded-xl border bg-card p-4 sm:p-5"
          >
            <p className="text-sm font-medium">新增任务</p>
            <div className="mt-3 flex items-baseline gap-4">
              <span className="text-2xl font-bold">本月 {comparison.created.current}</span>
              <span className="text-sm text-muted-foreground">
                上月 {comparison.created.previous}
              </span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {comparisonText(
                comparison.created.current,
                comparison.created.previous
              )}
            </p>
          </article>
          <article
            aria-label="每月完成任务比较"
            className="rounded-xl border bg-card p-4 sm:p-5"
          >
            <p className="text-sm font-medium">完成任务</p>
            <div className="mt-3 flex items-baseline gap-4">
              <span className="text-2xl font-bold">本月 {comparison.completed.current}</span>
              <span className="text-sm text-muted-foreground">
                上月 {comparison.completed.previous}
              </span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {comparisonText(
                comparison.completed.current,
                comparison.completed.previous
              )}
            </p>
          </article>
        </div>
      </section>
    </>
  );
}
