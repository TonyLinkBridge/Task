import type { SupabaseClient } from "@supabase/supabase-js";

import type { ApprovalActionRepository } from "@/features/approval/action-service";
import {
  mapContentRow,
  type ContentRow,
} from "@/features/content/repository";
import type { ContentRecord } from "@/features/content/types";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

function mapRpcResult(
  data: unknown,
  error: { message: string } | null
): ContentRecord {
  if (error || !data) {
    throw new Error(`CONTENT_DATABASE_ERROR:${error?.message ?? "NO_DATA"}`);
  }
  return mapContentRow(data as ContentRow);
}

export function createApprovalRepository(
  providedClient?: SupabaseClient
): ApprovalActionRepository {
  const client = () => providedClient ?? getSupabaseAdmin();

  return {
    async find(contentId) {
      const { data, error } = await client()
        .from("contents")
        .select("*")
        .eq("id", contentId)
        .is("archived_at", null)
        .maybeSingle();
      if (error) throw new Error(`CONTENT_DATABASE_ERROR:${error.message}`);
      return data ? mapContentRow(data as ContentRow) : null;
    },

    async submitForReview(
      contentId,
      blocknoteJson,
      actorId,
      requestedReviewerId
    ) {
      const { data, error } = await client().rpc("submit_content_for_review", {
        p_content_id: contentId,
        p_actor_id: actorId,
        p_blocknote_json: blocknoteJson,
        p_requested_reviewer_id: requestedReviewerId ?? null,
      });
      return mapRpcResult(data, error);
    },

    async approve(contentId, version, actorId) {
      const { data, error } = await client().rpc("approve_content_version", {
        p_content_id: contentId,
        p_version: version,
        p_admin_id: actorId,
      });
      return mapRpcResult(data, error);
    },

    async requestChanges(contentId, version, actorId, message) {
      const { data, error } = await client().rpc("request_content_changes", {
        p_content_id: contentId,
        p_version: version,
        p_admin_id: actorId,
        p_message: message,
      });
      return mapRpcResult(data, error);
    },

    async unlockApproved(contentId, actorId) {
      const { data, error } = await client().rpc("unlock_approved_content", {
        p_content_id: contentId,
        p_actor_id: actorId,
      });
      return mapRpcResult(data, error);
    },

    async markPublished(contentId, actorId) {
      const { data, error } = await client().rpc("mark_content_published", {
        p_content_id: contentId,
        p_actor_id: actorId,
      });
      return mapRpcResult(data, error);
    },

    async archive(contentId, actorId) {
      const { data, error } = await client().rpc("archive_content", {
        p_content_id: contentId,
        p_actor_id: actorId,
      });
      return mapRpcResult(data, error);
    },
  };
}

export const approvalRepository = createApprovalRepository();
