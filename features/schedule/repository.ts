import type { ContentStatus } from "@/features/content/types";
import type { ScheduledContent } from "@/features/schedule/types";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

type ScheduleRow = {
  id: string;
  title: string;
  status: Exclude<ContentStatus, "archived">;
  publish_at: string;
  current_version: number;
  required_approvals: 1 | 2;
  assignee: {
    clerk_user_id: string;
    display_name: string;
    avatar_url: string | null;
  };
  platform_links: {
    platform: { id: string; name: string; color: string };
  }[];
  approvals: {
    admin_id: string;
    version: number;
    invalidated_at: string | null;
  }[];
};

export async function listRawScheduledContent(): Promise<ScheduledContent[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("contents")
    .select(
      "id, title, status, publish_at, current_version, required_approvals, assignee:profiles!contents_assignee_id_fkey(clerk_user_id, display_name, avatar_url), platform_links:content_platforms(platform:platforms(id, name, color)), approvals:content_approvals(admin_id, version, invalidated_at)"
    )
    .is("archived_at", null)
    .order("publish_at");
  if (error) throw new Error(`SCHEDULE_DATABASE_ERROR:${error.message}`);

  return (data ?? []).map((item) => {
    const row = item as unknown as ScheduleRow;
    return {
      id: row.id,
      title: row.title,
      status: row.status,
      storedStatus: row.status,
      publishAt: row.publish_at,
      assignee: {
        id: row.assignee.clerk_user_id,
        name: row.assignee.display_name,
        imageUrl: row.assignee.avatar_url,
      },
      platforms: row.platform_links.map(({ platform }) => platform),
      requiredApprovals: row.required_approvals,
      approvalAdminIds: row.approvals
        .filter(
          (approval) =>
            approval.version === row.current_version &&
            approval.invalidated_at === null
        )
        .map(({ admin_id }) => admin_id),
    };
  });
}
