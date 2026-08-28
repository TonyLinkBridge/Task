import type { ContentStatus } from "@/features/content/types";

export type ScheduledPlatform = {
  id: string;
  name: string;
  color: string;
};

export type ScheduledAssignee = {
  id: string;
  name: string;
  imageUrl: string | null;
};

export type ScheduledContent = {
  id: string;
  title: string;
  status: Exclude<ContentStatus, "archived">;
  storedStatus: Exclude<ContentStatus, "archived">;
  publishAt: string;
  assignee: ScheduledAssignee;
  platforms: ScheduledPlatform[];
  requiredApprovals: 1 | 2;
  approvalAdminIds: string[];
};

export type ScheduleFilters = {
  platformId?: string;
  assigneeId?: string;
  status?: ScheduledContent["status"];
  from?: string;
  to?: string;
};
