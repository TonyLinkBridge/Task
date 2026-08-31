import { getSupabaseAdmin } from "@/lib/supabase/admin";

const contentStatusLabels: Record<string, string> = {
  draft: "草稿",
  in_review: "等待审核",
  changes_requested: "需要修改",
  approved: "已经批准",
  due: "等待发布",
  published: "已经发布",
  archived: "已收起",
};

function safeQuery(query: string) {
  return query.replaceAll(",", " ").replaceAll("%", "").replaceAll("_", "");
}

export const globalSearchRepository = {
  async searchTasks(query: string) {
    const search = safeQuery(query);
    const { data, error } = await getSupabaseAdmin()
      .from("tasks")
      .select("id, title, project")
      .is("archived_at", null)
      .or(`title.ilike.%${search}%,project.ilike.%${search}%,description.ilike.%${search}%`)
      .limit(10);
    if (error) throw new Error(`TASK_SEARCH_FAILED:${error.message}`);
    return (data ?? []).map((task) => ({
      id: task.id,
      title: task.title,
      subtitle: task.project,
    }));
  },

  async searchContents(query: string) {
    const search = safeQuery(query);
    const { data, error } = await getSupabaseAdmin()
      .from("contents")
      .select("id, title, status")
      .is("archived_at", null)
      .ilike("title", `%${search}%`)
      .limit(10);
    if (error) throw new Error(`CONTENT_SEARCH_FAILED:${error.message}`);
    return (data ?? []).map((content) => ({
      id: content.id,
      title: content.title,
      subtitle: contentStatusLabels[content.status] ?? content.status,
    }));
  },
};
