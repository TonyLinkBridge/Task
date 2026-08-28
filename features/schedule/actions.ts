import { revalidatePath } from "next/cache";
import { z } from "zod";

import { contentRepository } from "@/features/content/repository";
import { contentBoardMoveMessage } from "@/features/schedule/board-rules";
import { getVerifiedUser } from "@/lib/auth/get-verified-user";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

const inputSchema = z.object({
  contentId: z.uuid(),
  status: z.enum(["draft", "changes_requested"]),
});

export async function moveEditableContent(
  contentId: string,
  status: "draft" | "changes_requested"
) {
  "use server";
  const user = await getVerifiedUser();
  const parsed = inputSchema.safeParse({ contentId, status });
  if (!parsed.success) return { ok: false as const, message: "不能移到这个状态。" };

  const content = await contentRepository.find(parsed.data.contentId);
  if (!content) return { ok: false as const, message: "找不到这份内容。" };
  if (content.status === "archived") {
    return { ok: false as const, message: "这份内容已经收起。" };
  }
  if (
    user.role !== "admin" &&
    content.authorId !== user.id &&
    content.assigneeId !== user.id
  ) {
    return { ok: false as const, message: "你不能移动这份内容。" };
  }
  const message = contentBoardMoveMessage(content.status, parsed.data.status);
  if (message) return { ok: false as const, message };

  const { data, error } = await getSupabaseAdmin()
    .from("contents")
    .update({ status: parsed.data.status, updated_at: new Date().toISOString() })
    .eq("id", parsed.data.contentId)
    .eq("status", content.status)
    .is("archived_at", null)
    .select("id")
    .maybeSingle();
  if (error || !data) {
    return { ok: false as const, message: "内容已经更新，请重新打开。" };
  }

  revalidatePath("/content");
  revalidatePath(`/content/${content.id}`);
  return { ok: true as const };
}
