import { ChartColumnIcon, ChartLineData01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import type { TaskRecord, TaskStatus } from "@/features/tasks/types";

const MALAYSIA_OFFSET_MS = 8 * 60 * 60 * 1000;

const statusLabels: Record<TaskStatus, string> = {
  todo: "还没开始",
  in_progress: "正在做",
  review: "等人检查",
  done: "已经完成",
};

const statusColors: Record<TaskStatus, string> = {
  todo: "bg-slate-400",
  in_progress: "bg-blue-500",
  review: "bg-amber-500",
  done: "bg-emerald-500",
};

function malaysiaDateKey(value: Date | string) {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Date(date.getTime() + MALAYSIA_OFFSET_MS)
    .toISOString()
    .slice(0, 10);
}

export function getTaskChartData(tasks: TaskRecord[], now = new Date()) {
  const statuses = (Object.keys(statusLabels) as TaskStatus[]).map((status) => ({
    status,
    label: statusLabels[status],
    value: tasks.filter((task) => task.status === status).length,
  }));

  const malaysiaNow = new Date(now.getTime() + MALAYSIA_OFFSET_MS);
  const days = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(
      Date.UTC(
        malaysiaNow.getUTCFullYear(),
        malaysiaNow.getUTCMonth(),
        malaysiaNow.getUTCDate() - (6 - index)
      )
    );
    const key = day.toISOString().slice(0, 10);
    return {
      key,
      label: `${day.getUTCMonth() + 1}月${day.getUTCDate()}日`,
      value: tasks.filter(
        (task) => task.status === "done" && malaysiaDateKey(task.updatedAt) === key
      ).length,
    };
  });

  return { statuses, days };
}

export function ChartsSection({
  tasks,
  now,
}: {
  tasks: TaskRecord[];
  now?: Date;
}) {
  const { statuses, days } = getTaskChartData(tasks, now);
  const largestStatus = Math.max(1, ...statuses.map(({ value }) => value));
  const largestDay = Math.max(1, ...days.map(({ value }) => value));

  return (
    <div className="grid gap-4 px-4 sm:px-6 lg:grid-cols-2">
      <section aria-label="任务状态分布" className="rounded-xl border bg-card p-4 sm:p-5">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg border">
            <HugeiconsIcon icon={ChartColumnIcon} className="size-[18px] text-muted-foreground" />
          </div>
          <div>
            <h2 className="text-sm font-medium">任务状态分布</h2>
            <p className="text-xs text-muted-foreground">现在每个阶段有多少任务</p>
          </div>
        </div>
        <div className="mt-5 space-y-3">
          {statuses.map(({ status, label, value }) => (
            <div key={status} className="grid grid-cols-[5rem_1fr_2rem] items-center gap-3 text-xs">
              <span>{label}</span>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full ${statusColors[status]}`}
                  style={{ width: `${(value / largestStatus) * 100}%` }}
                />
              </div>
              <span className="text-right font-medium">{value}</span>
            </div>
          ))}
        </div>
      </section>

      <section aria-label="最近 7 天完成趋势" className="rounded-xl border bg-card p-4 sm:p-5">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg border">
            <HugeiconsIcon icon={ChartLineData01Icon} className="size-[18px] text-muted-foreground" />
          </div>
          <div>
            <h2 className="text-sm font-medium">最近 7 天完成趋势</h2>
            <p className="text-xs text-muted-foreground">每天完成了多少任务</p>
          </div>
        </div>
        <div className="mt-5 grid h-28 grid-cols-7 items-end gap-2">
          {days.map(({ key, label, value }) => (
            <div key={key} className="flex min-w-0 flex-col items-center gap-1.5">
              <span className="text-[10px] font-medium" aria-label={`${label}完成 ${value} 项`}>
                完成 {value} 项
              </span>
              <div className="flex h-16 w-full items-end justify-center rounded-md bg-muted/60 px-1">
                <div
                  className="w-full max-w-8 rounded-t bg-primary"
                  style={{ height: `${Math.max(value ? 12 : 2, (value / largestDay) * 100)}%` }}
                />
              </div>
              <span className="truncate text-[10px] text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
