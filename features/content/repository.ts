import type { SupabaseClient } from "@supabase/supabase-js";

import type { ContentInput } from "@/features/content/schema";
import type {
  ContentAttachment,
  ContentComment,
  ContentCommentView,
  ContentRecord,
  ContentStatus,
} from "@/features/content/types";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export type ContentRow = {
  id: string;
  title: string;
  status: ContentStatus;
  author_id: string;
  assignee_id: string;
  publish_at: string;
  liveblocks_room_id: string;
  current_version: number;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
};

type ContentCommentRow = {
  id: string;
  content_id: string;
  author_id: string;
  body: string;
  created_at: string;
  author: { display_name: string; avatar_url: string | null };
};

export function mapContentCommentRow(
  row: ContentCommentRow
): ContentCommentView {
  return {
    id: row.id,
    contentId: row.content_id,
    authorId: row.author_id,
    body: row.body,
    createdAt: row.created_at,
    authorName: row.author.display_name,
    authorImageUrl: row.author.avatar_url,
  };
}

export function mapContentRow(row: ContentRow): ContentRecord {
  return {
    id: row.id,
    title: row.title,
    status: row.status,
    authorId: row.author_id,
    assigneeId: row.assignee_id,
    publishAt: row.publish_at,
    liveblocksRoomId: row.liveblocks_room_id,
    currentVersion: row.current_version,
    archivedAt: row.archived_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function assertData<T>(data: T | null, error: { message: string } | null): T {
  if (error || !data) {
    throw new Error(`CONTENT_DATABASE_ERROR:${error?.message ?? "NO_DATA"}`);
  }
  return data;
}

export function createContentRepository(
  providedClient?: SupabaseClient,
  createId: () => string = () => crypto.randomUUID()
) {
  const client = () => providedClient ?? getSupabaseAdmin();

  return {
    async create(input: ContentInput, authorId: string): Promise<ContentRecord> {
      const contentId = createId();
      const { data, error } = await client().rpc("create_content", {
        p_id: contentId,
        p_title: input.title,
        p_author_id: authorId,
        p_assignee_id: input.assigneeId,
        p_publish_at: input.publishAt,
        p_platform_ids: input.platformIds,
      });
      return mapContentRow(assertData(data as ContentRow | null, error));
    },

    async find(id: string): Promise<ContentRecord | null> {
      const { data, error } = await client()
        .from("contents")
        .select("*")
        .eq("id", id)
        .is("archived_at", null)
        .maybeSingle();
      if (error) throw new Error(`CONTENT_DATABASE_ERROR:${error.message}`);
      return data ? mapContentRow(data as ContentRow) : null;
    },

    async findByRoomId(roomId: string): Promise<ContentRecord | null> {
      const { data, error } = await client()
        .from("contents")
        .select("*")
        .eq("liveblocks_room_id", roomId)
        .is("archived_at", null)
        .maybeSingle();
      if (error) throw new Error(`CONTENT_DATABASE_ERROR:${error.message}`);
      return data ? mapContentRow(data as ContentRow) : null;
    },

    async createSnapshot(
      contentId: string,
      actorId: string,
      blocknoteJson: unknown
    ): Promise<string> {
      const { data, error } = await client().rpc("create_content_snapshot", {
        p_content_id: contentId,
        p_actor_id: actorId,
        p_blocknote_json: blocknoteJson,
      });
      return assertData(data as string | null, error);
    },

    async addComment(
      contentId: string,
      authorId: string,
      body: string
    ): Promise<ContentComment> {
      const { data, error } = await client()
        .from("content_comments")
        .insert({ content_id: contentId, author_id: authorId, body })
        .select("*")
        .single();
      const row = assertData(data, error);
      return {
        id: row.id,
        contentId: row.content_id,
        authorId: row.author_id,
        body: row.body,
        createdAt: row.created_at,
      };
    },

    async listComments(contentId: string): Promise<ContentCommentView[]> {
      const { data, error } = await client()
        .from("content_comments")
        .select(
          "id, content_id, author_id, body, created_at, author:profiles!content_comments_author_id_fkey(display_name, avatar_url)"
        )
        .eq("content_id", contentId)
        .order("created_at");
      if (error) throw new Error(`CONTENT_DATABASE_ERROR:${error.message}`);
      return (data ?? []).map((row) =>
        mapContentCommentRow(row as unknown as ContentCommentRow)
      );
    },

    async findAttachment(id: string): Promise<ContentAttachment | null> {
      const { data, error } = await client()
        .from("content_attachments")
        .select("*, content:contents!inner(archived_at)")
        .eq("id", id)
        .is("content.archived_at", null)
        .maybeSingle();
      if (error) throw new Error(`CONTENT_DATABASE_ERROR:${error.message}`);
      if (!data) return null;
      return {
        id: data.id,
        contentId: data.content_id,
        storagePath: data.storage_path,
        fileName: data.file_name,
        mimeType: data.mime_type,
        byteSize: Number(data.byte_size),
        uploaderId: data.uploader_id,
        createdAt: data.created_at,
      };
    },
  };
}

export const contentRepository = createContentRepository();

export async function createContentSnapshot(
  contentId: string,
  actorId: string,
  blocknoteJson: unknown
): Promise<string> {
  return contentRepository.createSnapshot(contentId, actorId, blocknoteJson);
}
