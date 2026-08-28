import { TaskBoard } from "@/features/tasks/components/task-board";
import { TaskFiltersBar } from "@/features/tasks/components/task-filters";
import type { AssignableUser, TaskFilters, TaskRecord, TaskStatus } from "@/features/tasks/types";

type MoveResult = { ok: true; data: TaskRecord } | { ok: false; message: string };

export function TasksMain({ tasks, assignees, filters, createTaskAction, updateTaskAction, moveTaskAction }: {
  tasks: TaskRecord[];
  assignees: AssignableUser[];
  filters: TaskFilters;
  createTaskAction: (input: unknown) => Promise<MoveResult>;
  updateTaskAction: (id: string, input: unknown) => Promise<MoveResult>;
  moveTaskAction: (id: string, status: TaskStatus, position: number) => Promise<MoveResult>;
}) {
  const doneCount = tasks.filter(({ status }) => status === "done").length;
  const reviewCount = tasks.filter(({ status }) => status === "review").length;
  const boardKey = tasks.map(({ id, updatedAt }) => `${id}:${updatedAt}`).join("|");

  return (
    <div className="flex w-full flex-col gap-5 py-5">
      <div className="grid gap-3 px-4 sm:grid-cols-3 sm:px-6">
        <div className="rounded-xl border bg-card p-4"><p className="text-xs text-muted-foreground">进行中的任务</p><p className="mt-2 text-2xl font-semibold">{tasks.length - doneCount}</p></div>
        <div className="rounded-xl border bg-card p-4"><p className="text-xs text-muted-foreground">等待检查</p><p className="mt-2 text-2xl font-semibold">{reviewCount}</p></div>
        <div className="rounded-xl border bg-card p-4"><p className="text-xs text-muted-foreground">已经完成</p><p className="mt-2 text-2xl font-semibold">{doneCount}</p></div>
      </div>
      <TaskFiltersBar filters={filters} assignees={assignees} />
      <TaskBoard key={boardKey} initialTasks={tasks} assignees={assignees} createTaskAction={createTaskAction} updateTaskAction={updateTaskAction} moveTaskAction={moveTaskAction} />
    </div>
  );
}
