import "server-only";

import { Liveblocks } from "@liveblocks/node";

import type { VerifiedUser } from "@/lib/auth/types";
import { getServerEnv } from "@/lib/env/server";

let serverClient: Liveblocks | undefined;

function getLiveblocksServer() {
  serverClient ??= new Liveblocks({ secret: getServerEnv().LIVEBLOCKS_SECRET_KEY });
  return serverClient;
}

function userColor(userId: string) {
  const colors = ["#2563eb", "#7c3aed", "#059669", "#dc2626"];
  const total = [...userId].reduce((sum, character) => sum + character.charCodeAt(0), 0);
  return colors[total % colors.length];
}

export async function authorizeContentRoom(
  user: VerifiedUser,
  roomId: string
): Promise<{ token: string }> {
  const session = getLiveblocksServer().prepareSession(user.id, {
    userInfo: {
      name: user.name,
      avatar: user.imageUrl ?? "",
      role: user.role,
      color: userColor(user.id),
    },
  });
  session.allow(roomId, ["*:write"]);

  const authorization = await session.authorize();
  if (authorization.status !== 200) {
    throw authorization.error ?? new Error("LIVEBLOCKS_AUTH_FAILED");
  }
  return JSON.parse(authorization.body) as { token: string };
}
