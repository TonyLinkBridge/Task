import type { MessageMember, PrivateMessage } from "@/features/messages/types";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

type MessageRow = {
  id: string;
  sender_id: string;
  recipient_id: string;
  body: string;
  read_at: string | null;
  created_at: string;
  sender: { display_name: string } | { display_name: string }[];
  recipient: { display_name: string } | { display_name: string }[];
};

function profileName(
  profile: { display_name: string } | { display_name: string }[]
) {
  return Array.isArray(profile) ? profile[0]?.display_name ?? "成员" : profile.display_name;
}

function mapMessage(row: MessageRow): PrivateMessage {
  return {
    id: row.id,
    senderId: row.sender_id,
    senderName: profileName(row.sender),
    recipientId: row.recipient_id,
    recipientName: profileName(row.recipient),
    body: row.body,
    readAt: row.read_at,
    createdAt: row.created_at,
  };
}

const MESSAGE_SELECT =
  "id, sender_id, recipient_id, body, read_at, created_at, sender:profiles!private_messages_sender_id_fkey(display_name), recipient:profiles!private_messages_recipient_id_fkey(display_name)";

export const privateMessagesRepository = {
  async list(userId: string) {
    const { data, error } = await getSupabaseAdmin()
      .from("private_messages")
      .select(MESSAGE_SELECT)
      .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(`MESSAGE_LIST_FAILED:${error.message}`);
    return (data ?? []).map((row) => mapMessage(row as unknown as MessageRow));
  },

  async listMembers(userId: string): Promise<MessageMember[]> {
    const { data, error } = await getSupabaseAdmin()
      .from("profiles")
      .select("clerk_user_id, display_name, avatar_url")
      .neq("clerk_user_id", userId)
      .is("archived_at", null)
      .order("display_name");
    if (error) throw new Error(`MESSAGE_MEMBERS_FAILED:${error.message}`);
    return (data ?? []).map((profile) => ({
      id: profile.clerk_user_id,
      name: profile.display_name,
      imageUrl: profile.avatar_url,
    }));
  },

  async send(input: { senderId: string; recipientId: string; body: string }) {
    const { data, error } = await getSupabaseAdmin()
      .from("private_messages")
      .insert({
        sender_id: input.senderId,
        recipient_id: input.recipientId,
        body: input.body,
      })
      .select(MESSAGE_SELECT)
      .single();
    if (error || !data) throw new Error(`MESSAGE_SEND_FAILED:${error?.message}`);
    return mapMessage(data as unknown as MessageRow);
  },

  async markReceivedRead(userId: string) {
    const { error } = await getSupabaseAdmin()
      .from("private_messages")
      .update({ read_at: new Date().toISOString() })
      .eq("recipient_id", userId)
      .is("read_at", null);
    if (error) throw new Error(`MESSAGE_READ_FAILED:${error.message}`);
  },
};
