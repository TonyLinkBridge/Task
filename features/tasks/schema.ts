import { z } from "zod";

import { TASK_PRIORITIES } from "@/features/tasks/types";
import type { TaskFilters } from "@/features/tasks/types";

export const taskInputSchema = z.object({
  title: z.string().trim().min(1).max(200),
  project: z.string().trim().min(1).max(100),
  description: z.string().trim().max(10_000).default(""),
  assigneeId: z.string().trim().min(1),
  assigneeIds: z.array(z.string().trim().min(1)).min(1).max(10).optional(),
  priority: z.enum(TASK_PRIORITIES),
  dueAt: z.iso.datetime({ offset: true }),
}).refine(
  (input) => !input.assigneeIds || input.assigneeIds.includes(input.assigneeId),
  { path: ["assigneeIds"], message: "主要负责人必须包含在负责人名单内" }
);

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
  const project = first(params.project)?.trim();
  const assigneeId = first(params.assignee)?.trim();

  if (search) filters.search = search.slice(0, 100);
  if (project) filters.project = project.slice(0, 100);
  if (TASK_PRIORITIES.includes(priority as (typeof TASK_PRIORITIES)[number])) {
    filters.priority = priority as TaskFilters["priority"];
  }
  if (assigneeId) filters.assigneeId = assigneeId;

  return filters;
}
