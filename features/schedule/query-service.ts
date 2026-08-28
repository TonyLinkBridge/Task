import { toMalaysiaDateKey } from "@/features/schedule/date";
import type { ScheduleFilters, ScheduledContent } from "@/features/schedule/types";
import type { VerifiedUser } from "@/lib/auth/types";
import type { ContentStatus } from "@/features/content/types";

type Dependencies = {
  getVerifiedUser: () => Promise<VerifiedUser>;
  list: () => Promise<ScheduledContent[]>;
  now: () => Date;
};

export function effectiveContentStatus(
  status: ContentStatus,
  publishAt: string,
  now: Date
): ContentStatus {
  return status === "approved" && publishAt <= now.toISOString()
    ? "due"
    : status;
}

export function makeScheduleQueries(dependencies: Dependencies) {
  return {
    async listScheduledContent(filters: ScheduleFilters = {}) {
      await dependencies.getVerifiedUser();
      const now = dependencies.now();
      const contents = (await dependencies.list()).map((content) => ({
        ...content,
        status: effectiveContentStatus(
          content.storedStatus,
          content.publishAt,
          now
        ) as ScheduledContent["status"],
      }));

      return contents.filter((content) => {
        const dateKey = toMalaysiaDateKey(content.publishAt);
        if (filters.platformId && !content.platforms.some(({ id }) => id === filters.platformId)) return false;
        if (filters.assigneeId && content.assignee.id !== filters.assigneeId) return false;
        if (filters.status && content.status !== filters.status) return false;
        if (filters.from && dateKey < filters.from) return false;
        if (filters.to && dateKey > filters.to) return false;
        return true;
      });
    },
  };
}
