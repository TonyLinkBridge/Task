import { z } from "zod";

import { TASK_PRIORITIES } from "@/features/tasks/types";
import type { TaskFilters } from "@/features/tasks/types";

export const taskInputSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(10_000).default(""),
  assigneeId: z.string().trim().min(1),
  priority: z.enum(TASK_PRIORITIES),
  dueAt: z.iso.datetime({ offset: true }),
});

export type TaskInput = z.infer<typeof taskInputSchema>;

type TaskSearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function taskFiltersFromSearchParams(
  params: TaskSearchParams
): TaskFilters {
  const filters: TaskFilters = {};
  const search = first(params.search)?.trim();
  const priority = first(params.priority);
  const assigneeId = first(params.assignee)?.trim();

  if (search) filters.search = search.slice(0, 100);
  if (TASK_PRIORITIES.includes(priority as (typeof TASK_PRIORITIES)[number])) {
    filters.priority = priority as TaskFilters["priority"];
  }
  if (assigneeId) filters.assigneeId = assigneeId;

  return filters;
}
