import "server-only";

import { Liveblocks } from "@liveblocks/node";

import type { VerifiedUser } from "@/lib/auth/types";
import { getServerEnv } from "@/lib/env/server";
import { roomPermissions } from "@/features/content/room-permissions";

let serverClient: Liveblocks | undefined;

function getLiveblocksServer() {
  serverClient ??= new Liveblocks({ secret: getServerEnv().LIVEBLOCKS_SECRET_KEY });
  return serverClient;
}

export function getUserColor(userId: string) {
  const colors = ["#2563eb", "#7c3aed", "#059669", "#dc2626"];
  const total = [...userId].reduce((sum, character) => sum + character.charCodeAt(0), 0);
  return colors[total % colors.length];
}

export async function authorizeContentRoom(
  user: VerifiedUser,
  roomId: string,
  editable: boolean
): Promise<{ token: string }> {
  const client = getLiveblocksServer();
  const permissions = roomPermissions(editable);
  await client.upsertRoom(roomId, {
    update: { defaultAccesses: permissions },
    create: { defaultAccesses: permissions },
  });
  const authorization = await client.identifyUser(user.id, {
    userInfo: {
      name: user.name,
      avatar: user.imageUrl ?? "",
      role: user.role,
      color: getUserColor(user.id),
    },
  });
  if (authorization.status !== 200) {
    throw authorization.error ?? new Error("LIVEBLOCKS_AUTH_FAILED");
  }
  return JSON.parse(authorization.body) as { token: string };
}

export async function setContentRoomEditable(
  roomId: string,
  editable: boolean
): Promise<void> {
  const permissions = roomPermissions(editable);
  await getLiveblocksServer().upsertRoom(roomId, {
    update: { defaultAccesses: permissions },
    create: { defaultAccesses: permissions },
  });
}

export async function clearResolvedContentThreads(
  roomId: string
): Promise<number> {
  const client = getLiveblocksServer();
  const { data: threads } = await client.getThreads({
    roomId,
    query: { resolved: true },
  });
  await Promise.all(
    threads.map((thread) =>
      client.deleteThread({ roomId, threadId: thread.id })
    )
  );
  return threads.length;
}

export async function deleteContentRoom(roomId: string): Promise<void> {
  await getLiveblocksServer().deleteRoom(roomId);
}
