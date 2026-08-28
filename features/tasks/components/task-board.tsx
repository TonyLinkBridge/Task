"use client";

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useState } from "react";

import { TaskForm } from "@/features/tasks/components/task-form";
import { TaskColumn } from "@/features/tasks/components/task-column";
import { groupTasksByStatus } from "@/features/tasks/status";
import { TASK_STATUSES } from "@/features/tasks/types";
import type { AssignableUser, TaskRecord, TaskStatus } from "@/features/tasks/types";

type MoveResult = { ok: true; data: TaskRecord } | { ok: false; message: string };

type PersistTaskMoveInput = {
  tasks: TaskRecord[];
  taskId: string;
  status: TaskStatus;
  position: number;
  move: () => Promise<MoveResult>;
  showTasks: (tasks: TaskRecord[]) => void;
};

export async function persistTaskMove({
  tasks,
  taskId,
  status,
  position,
  move,
  showTasks,
}: PersistTaskMoveInput): Promise<string | null> {
  const optimisticTasks = tasks.map((task) =>
    task.id === taskId ? { ...task, status, position } : task
  );
  showTasks(optimisticTasks);

  try {
    const result = await move();
    if (!result.ok) {
      showTasks(tasks);
      return result.message;
    }
  } catch {
    showTasks(tasks);
    return "暂时无法保存，请稍后再试。";
  }

  return null;
}

type MoveTaskAction = (
  id: string,
  status: TaskStatus,
  position: number
) => Promise<MoveResult>;
type SaveTaskAction = (input: unknown) => Promise<MoveResult>;
type UpdateTaskAction = (id: string, input: unknown) => Promise<MoveResult>;

export function TaskBoard({
  initialTasks,
  assignees,
  moveTaskAction = async () => ({
    ok: false as const,
    message: "暂时无法保存，请稍后再试。",
  }),
  createTaskAction,
  updateTaskAction,
}: {
  initialTasks: TaskRecord[];
  assignees: AssignableUser[];
  moveTaskAction?: MoveTaskAction;
  createTaskAction?: SaveTaskAction;
  updateTaskAction?: UpdateTaskAction;
}) {
  const [tasks, setTasks] = useState(initialTasks);
  const [editingTask, setEditingTask] = useState<TaskRecord | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
  const grouped = groupTasksByStatus(tasks);

  async function handleDragEnd(event: DragEndEvent) {
    if (!event.over) return;
    const activeTask = tasks.find(({ id }) => id === event.active.id);
    if (!activeTask) return;

    const overTask = tasks.find(({ id }) => id === event.over?.id);
    const targetStatus =
      (event.over.data.current?.status as TaskStatus | undefined) ??
      overTask?.status;
    if (!targetStatus) return;

    const targetTasks = grouped[targetStatus].filter(
      ({ id }) => id !== activeTask.id
    );
    const position =
      targetTasks.length === 0
        ? 1000
        : Math.max(...targetTasks.map((task) => task.position)) + 1000;

    setErrorMessage(null);
    const message = await persistTaskMove({
      tasks,
      taskId: activeTask.id,
      status: targetStatus,
      position,
      move: () => moveTaskAction(activeTask.id, targetStatus, position),
      showTasks: setTasks,
    });
    setErrorMessage(message);
  }

  return (
    <div>
      <div className="flex justify-end px-4 pb-4 sm:px-6">
        <TaskForm
          assignees={assignees}
          createTaskAction={createTaskAction}
          onSaved={(savedTask) => setTasks((current) => [...current, savedTask])}
        />
      </div>
      {editingTask ? (
        <TaskForm
          key={editingTask.id}
          assignees={assignees}
          initialTask={editingTask}
          open
          showTrigger={false}
          updateTaskAction={updateTaskAction}
          onOpenChange={(isOpen) => {
            if (!isOpen) setEditingTask(null);
          }}
          onSaved={(savedTask) => {
            setTasks((current) => current.map((task) => task.id === savedTask.id ? savedTask : task));
            setEditingTask(null);
          }}
        />
      ) : null}
      {errorMessage ? (
        <p
          role="alert"
          className="mx-4 mb-3 rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive sm:mx-6"
        >
          {errorMessage}
        </p>
      ) : null}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto px-4 pb-6 sm:px-6">
          {TASK_STATUSES.map((status) => (
            <TaskColumn
              key={status}
              status={status}
              tasks={grouped[status]}
              assignees={assignees}
              onEdit={setEditingTask}
            />
          ))}
        </div>
      </DndContext>
    </div>
  );
}
