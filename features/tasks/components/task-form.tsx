"use client";

import { Add01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { TaskInput } from "@/features/tasks/schema";
import type { AssignableUser, TaskRecord } from "@/features/tasks/types";

type TaskActionResult =
  | { ok: true; data: TaskRecord }
  | { ok: false; message: string };

type TaskFormProps = {
  assignees: AssignableUser[];
  initialTask?: TaskRecord | null;
  createTaskAction?: (input: unknown) => Promise<TaskActionResult>;
  updateTaskAction?: (id: string, input: unknown) => Promise<TaskActionResult>;
  onSaved?: (task: TaskRecord) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  showTrigger?: boolean;
};

function malaysiaDateTimeInput(iso: string): string {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Kuala_Lumpur",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .format(new Date(iso))
    .replace(" ", "T");
}

function defaultDueAt() {
  return malaysiaDateTimeInput(
    new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  );
}

export function TaskForm({
  assignees,
  initialTask,
  createTaskAction = async () => ({
    ok: false,
    message: "暂时无法保存，请稍后再试。",
  }),
  updateTaskAction = async () => ({
    ok: false,
    message: "暂时无法保存，请稍后再试。",
  }),
  onSaved,
  open: controlledOpen,
  onOpenChange,
  showTrigger = true,
}: TaskFormProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [title, setTitle] = useState(initialTask?.title ?? "");
  const [description, setDescription] = useState(initialTask?.description ?? "");
  const [assigneeId, setAssigneeId] = useState(
    initialTask?.assigneeId ?? assignees[0]?.id ?? ""
  );
  const [priority, setPriority] = useState<TaskRecord["priority"]>(
    initialTask?.priority ?? "medium"
  );
  const [dueAt, setDueAt] = useState(
    initialTask ? malaysiaDateTimeInput(initialTask.dueAt) : defaultDueAt()
  );
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const open = controlledOpen ?? internalOpen;

  function changeOpen(nextOpen: boolean) {
    setInternalOpen(nextOpen);
    onOpenChange?.(nextOpen);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    const input: TaskInput = {
      title,
      description,
      assigneeId,
      priority,
      dueAt: new Date(`${dueAt}:00+08:00`).toISOString(),
    };

    setIsSaving(true);
    const result = initialTask
      ? await updateTaskAction(initialTask.id, input)
      : await createTaskAction(input);
    setIsSaving(false);

    if (!result.ok) {
      setErrorMessage(result.message);
      return;
    }

    onSaved?.(result.data);
    changeOpen(false);
    if (!initialTask) {
      setTitle("");
      setDescription("");
      setPriority("medium");
      setDueAt(defaultDueAt());
    }
  }

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      {showTrigger ? (
        <DialogTrigger
          render={
            <Button>
              <HugeiconsIcon icon={Add01Icon} />
              新增任务
            </Button>
          }
        />
      ) : null}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initialTask ? "修改任务" : "新增任务"}</DialogTitle>
        </DialogHeader>
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="task-title">标题</Label>
            <Input
              id="task-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={200}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="task-description">说明</Label>
            <textarea
              id="task-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={10_000}
              rows={4}
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="task-assignee">负责人</Label>
              <select
                id="task-assignee"
                value={assigneeId}
                onChange={(event) => setAssigneeId(event.target.value)}
                required
                className="h-9 rounded-md border border-input bg-background px-2.5 text-sm"
              >
                {assignees.map((assignee) => (
                  <option key={assignee.id} value={assignee.id}>
                    {assignee.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="task-priority">优先级</Label>
              <select
                id="task-priority"
                value={priority}
                onChange={(event) =>
                  setPriority(event.target.value as TaskRecord["priority"])
                }
                className="h-9 rounded-md border border-input bg-background px-2.5 text-sm"
              >
                <option value="low">普通</option>
                <option value="medium">重要</option>
                <option value="urgent">紧急</option>
              </select>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="task-due-at">完成时间</Label>
            <Input
              id="task-due-at"
              type="datetime-local"
              value={dueAt}
              onChange={(event) => setDueAt(event.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">使用马来西亚时间</p>
          </div>
          {errorMessage ? (
            <p role="alert" className="text-sm text-destructive">
              {errorMessage}
            </p>
          ) : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => changeOpen(false)}
            >
              取消
            </Button>
            <Button type="submit" disabled={isSaving || assignees.length === 0}>
              {isSaving ? "正在保存…" : "保存任务"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
