import { z } from "zod";

import { makeScheduleQueries } from "@/features/schedule/query-service";
import { listRawScheduledContent } from "@/features/schedule/repository";
import type { ScheduleFilters } from "@/features/schedule/types";
import { getVerifiedUser } from "@/lib/auth/get-verified-user";

const filterSchema = z.object({
  platform: z.uuid().optional().catch(undefined),
  assignee: z.string().trim().min(1).optional().catch(undefined),
  status: z
    .enum(["draft", "in_review", "changes_requested", "approved", "due", "published"])
    .optional()
    .catch(undefined),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().catch(undefined),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().catch(undefined),
});

const scheduleQueries = makeScheduleQueries({
  getVerifiedUser,
  list: listRawScheduledContent,
  now: () => new Date(),
});

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function scheduleFiltersFromSearchParams(
  params: Record<string, string | string[] | undefined>
): ScheduleFilters {
  const parsed = filterSchema.parse({
    platform: first(params.platform),
    assignee: first(params.assignee),
    status: first(params.status),
    from: first(params.from),
    to: first(params.to),
  });
  return {
    platformId: parsed.platform,
    assigneeId: parsed.assignee,
    status: parsed.status,
    from: parsed.from,
    to: parsed.to,
  };
}

export async function listScheduledContent(filters: ScheduleFilters = {}) {
  return scheduleQueries.listScheduledContent(filters);
}
