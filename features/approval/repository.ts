import type { SupabaseClient } from "@supabase/supabase-js";

import type { ApprovalActionRepository } from "@/features/approval/action-service";
import type {
  ContentApprovalView,
  ContentReviewEventView,
  ReviewEventType,
} from "@/features/approval/types";
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
): ApprovalActionRepository & {
  listApprovals(contentId: string): Promise<ContentApprovalView[]>;
  listHistory(contentId: string): Promise<ContentReviewEventView[]>;
} {
  const client = () => providedClient ?? getSupabaseAdmin();

  return {
    async listApprovals(contentId) {
      const { data, error } = await client()
        .from("content_approvals")
        .select(
          "id, content_id, version, admin_id, approved_at, invalidated_at, admin:profiles!content_approvals_admin_id_fkey(display_name, avatar_url)"
        )
        .eq("content_id", contentId)
        .order("approved_at");
      if (error) throw new Error(`CONTENT_DATABASE_ERROR:${error.message}`);
      return (data ?? []).map((item) => {
        const row = item as unknown as {
          id: string;
          content_id: string;
          version: number;
          admin_id: string;
          approved_at: string;
          invalidated_at: string | null;
          admin: { display_name: string; avatar_url: string | null };
        };
        return {
          id: row.id,
          contentId: row.content_id,
          version: row.version,
          adminId: row.admin_id,
          approvedAt: row.approved_at,
          invalidatedAt: row.invalidated_at,
          adminName: row.admin.display_name,
          adminImageUrl: row.admin.avatar_url,
        };
      });
    },

    async listHistory(contentId) {
      const { data, error } = await client()
        .from("content_review_events")
        .select(
          "id, content_id, version, event_type, actor_id, message, created_at, actor:profiles!content_review_events_actor_id_fkey(display_name, avatar_url)"
        )
        .eq("content_id", contentId)
        .order("created_at", { ascending: false });
      if (error) throw new Error(`CONTENT_DATABASE_ERROR:${error.message}`);
      return (data ?? []).map((item) => {
        const row = item as unknown as {
          id: string;
          content_id: string;
          version: number;
          event_type: ReviewEventType;
          actor_id: string;
          message: string | null;
          created_at: string;
          actor: { display_name: string; avatar_url: string | null };
        };
        return {
          id: row.id,
          contentId: row.content_id,
          version: row.version,
          eventType: row.event_type,
          actorId: row.actor_id,
          message: row.message,
          createdAt: row.created_at,
          actorName: row.actor.display_name,
          actorImageUrl: row.actor.avatar_url,
        };
      });
    },

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
