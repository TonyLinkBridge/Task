import { z } from "zod";

import { TASK_PRIORITIES } from "@/features/tasks/types";

export const taskInputSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(10_000).default(""),
  assigneeId: z.string().trim().min(1),
  priority: z.enum(TASK_PRIORITIES),
  dueAt: z.iso.datetime({ offset: true }),
});

export type TaskInput = z.infer<typeof taskInputSchema>;
