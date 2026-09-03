import { TaskBoard } from "@/features/tasks/components/task-board";
import { TaskFiltersBar } from "@/features/tasks/components/task-filters";
import type { AssignableUser, TaskFilters, TaskRecord, TaskStatus } from "@/features/tasks/types";
import { StatsCards } from "./stats/stats-cards";
import { ChartsSection } from "./charts/charts-section";

type MoveResult = { ok: true; data: TaskRecord } | { ok: false; message: string };

export function TasksMain({ tasks, assignees, filters, createTaskAction, updateTaskAction, moveTaskAction }: {
  tasks: TaskRecord[];
  assignees: AssignableUser[];
  filters: TaskFilters;
  createTaskAction: (input: unknown) => Promise<MoveResult>;
  updateTaskAction: (id: string, input: unknown) => Promise<MoveResult>;
  moveTaskAction: (id: string, status: TaskStatus, position: number) => Promise<MoveResult>;
}) {
  const boardKey = tasks.map(({ id, updatedAt }) => `${id}:${updatedAt}`).join("|");

  return (
    <div className="flex w-full flex-col gap-5 py-5">
      <StatsCards tasks={tasks} />
      <ChartsSection tasks={tasks} />
      <TaskFiltersBar filters={filters} assignees={assignees} tasks={tasks} createTaskAction={createTaskAction} />
      <TaskBoard key={boardKey} initialTasks={tasks} assignees={assignees} createTaskAction={createTaskAction} updateTaskAction={updateTaskAction} moveTaskAction={moveTaskAction} />
    </div>
  );
}
