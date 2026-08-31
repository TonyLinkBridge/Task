"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";

import { Badge } from "@/components/ui/badge";
import { TaskCard } from "@/features/tasks/components/task-card";
import type { AssignableUser, TaskRecord, TaskStatus } from "@/features/tasks/types";

export const TASK_COLUMN_META: Record<
  TaskStatus,
  { label: string; color: string }
> = {
  todo: { label: "还没开始", color: "bg-slate-500" },
  in_progress: { label: "正在做", color: "bg-blue-500" },
  review: { label: "等人检查", color: "bg-amber-500" },
  done: { label: "已经完成", color: "bg-emerald-500" },
};

export function TaskColumn({
  status,
  tasks,
  assignees,
  onEdit,
}: {
  status: TaskStatus;
  tasks: TaskRecord[];
  assignees: AssignableUser[];
  onEdit?: (task: TaskRecord) => void;
}) {
  const meta = TASK_COLUMN_META[status];
  const { setNodeRef, isOver } = useDroppable({
    id: `column:${status}`,
    data: { status },
  });

  return (
    <section
      ref={setNodeRef}
      role="region"
      aria-label={meta.label}
      className={`flex w-[280px] shrink-0 flex-col rounded-2xl border bg-muted/40 p-2 transition-colors sm:w-[320px] ${
        isOver ? "border-primary bg-primary/5" : ""
      }`}
    >
      <div className="mb-2 flex items-center justify-between px-1 py-1">
        <div className="flex items-center gap-2">
          <span className={`size-2 rounded-full ${meta.color}`} />
          <h2 className="text-sm font-medium">{meta.label}</h2>
        </div>
        <Badge variant="secondary" className="rounded-full">
          {tasks.length}
        </Badge>
      </div>

      <SortableContext
        items={tasks.map(({ id }) => id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="min-h-24 space-y-2">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              assignees={assignees.filter(({ id }) =>
                (task.assigneeIds ?? [task.assigneeId]).includes(id)
              )}
              onEdit={onEdit}
            />
          ))}
          {tasks.length === 0 ? (
            <p className="rounded-xl border border-dashed p-5 text-center text-xs text-muted-foreground">
              把任务拖到这里
            </p>
          ) : null}
        </div>
      </SortableContext>
    </section>
  );
}
