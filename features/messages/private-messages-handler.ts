import { z } from "zod";

import type { MessageMember, PrivateMessage } from "@/features/messages/types";
import type { VerifiedUser } from "@/lib/auth/types";

type Dependencies = {
  getVerifiedUser: () => Promise<VerifiedUser>;
  list: (userId: string) => Promise<PrivateMessage[]>;
  listMembers: (userId: string) => Promise<MessageMember[]>;
  send: (input: {
    senderId: string;
    recipientId: string;
    body: string;
  }) => Promise<PrivateMessage>;
  markReceivedRead: (userId: string) => Promise<void>;
};

const messageSchema = z.object({
  recipientId: z.string().trim().min(1),
  body: z.string().trim().min(1).max(5000),
});

export function makePrivateMessagesHandler(dependencies: Dependencies) {
  return {
    async GET() {
      try {
        const user = await dependencies.getVerifiedUser();
        const [messages, members] = await Promise.all([
          dependencies.list(user.id),
          dependencies.listMembers(user.id),
        ]);
        return Response.json({
          messages,
          members,
          unreadCount: messages.filter(
            (message) => message.recipientId === user.id && !message.readAt
          ).length,
        });
      } catch {
        return Response.json({ error: "forbidden" }, { status: 403 });
      }
    },

    async POST(request: Request) {
      try {
        const user = await dependencies.getVerifiedUser();
        const parsed = messageSchema.safeParse(await request.json());
        if (!parsed.success || parsed.data.recipientId === user.id) {
          return Response.json({ error: "invalid_message" }, { status: 400 });
        }
        const members = await dependencies.listMembers(user.id);
        if (!members.some(({ id }) => id === parsed.data.recipientId)) {
          return Response.json({ error: "invalid_recipient" }, { status: 400 });
        }
        const message = await dependencies.send({
          senderId: user.id,
          recipientId: parsed.data.recipientId,
          body: parsed.data.body,
        });
        return Response.json({ message });
      } catch {
        return Response.json({ error: "forbidden" }, { status: 403 });
      }
    },

    async PATCH() {
      try {
        const user = await dependencies.getVerifiedUser();
        await dependencies.markReceivedRead(user.id);
        return Response.json({ ok: true });
      } catch {
        return Response.json({ error: "forbidden" }, { status: 403 });
      }
    },
  };
}
