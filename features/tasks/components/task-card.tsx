"use client";

import { Calendar03Icon, DragDropVerticalIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Link from "next/link";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AssignableUser, TaskRecord } from "@/features/tasks/types";

const priorityLabels = {
  low: "普通",
  medium: "重要",
  urgent: "紧急",
} as const;

const priorityStyles = {
  low: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  medium: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  urgent: "bg-red-500/10 text-red-700 dark:text-red-400",
} as const;

const dateFormatter = new Intl.DateTimeFormat("zh-MY", {
  timeZone: "Asia/Kuala_Lumpur",
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function TaskCard({
  task,
  assignees = [],
  onEdit,
}: {
  task: TaskRecord;
  assignees?: AssignableUser[];
  onEdit?: (task: TaskRecord) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id, data: { status: task.status } });

  return (
    <article
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`rounded-xl border bg-background p-4 shadow-xs ${
        isDragging ? "opacity-50" : ""
      }`}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <Badge className={`border-0 ${priorityStyles[task.priority]}`}>
          {priorityLabels[task.priority]}
        </Badge>
        {task.kind === "general" ? (
          <Button
            aria-label={`拖动 ${task.title}`}
            variant="ghost"
            size="icon-xs"
            {...attributes}
            {...listeners}
          >
            <HugeiconsIcon icon={DragDropVerticalIcon} />
          </Button>
        ) : null}
      </div>

      <Link
        href={`/tasks/${task.id}`}
        className="text-sm font-medium hover:underline"
      >
        {task.title}
      </Link>
      <p className="mt-1 text-xs text-muted-foreground">{task.project}</p>
      {task.description ? (
        <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted-foreground">
          {task.description}
        </p>
      ) : null}
      {task.kind === "content_publish" ? (
        <p className="mt-2 rounded-md bg-muted px-2.5 py-2 text-xs leading-5 text-muted-foreground">
          由内容排期控制，不能手动拖动
        </p>
      ) : null}

      <div className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
        <HugeiconsIcon icon={Calendar03Icon} className="size-4" />
        <span>{dateFormatter.format(new Date(task.dueAt))}</span>
      </div>

      <div className="mt-4 flex items-center justify-between border-t pt-3">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex -space-x-2">
            {assignees.slice(0, 3).map((assignee) => (
              <Avatar key={assignee.id} className="size-7 border-2 border-background">
                {assignee.imageUrl ? <AvatarImage src={assignee.imageUrl} alt={assignee.name} /> : null}
                <AvatarFallback>{assignee.name.slice(0, 1)}</AvatarFallback>
              </Avatar>
            ))}
          </div>
          <span className="truncate text-xs">
            {assignees.length ? assignees.map(({ name }) => name).join("、") : "未找到负责人"}
          </span>
        </div>
        {onEdit && task.kind === "general" ? (
          <Button variant="ghost" size="xs" onClick={() => onEdit(task)}>
            编辑
          </Button>
        ) : null}
      </div>
    </article>
  );
}
