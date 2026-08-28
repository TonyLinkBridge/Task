import type { VerifiedUser } from "@/lib/auth/types";
import { getVerifiedUser } from "@/lib/auth/get-verified-user";
import { authorizeContentRoom } from "@/lib/liveblocks/server";
import { contentRepository } from "@/features/content/repository";

type Dependencies = {
  getVerifiedUser: () => Promise<VerifiedUser>;
  findContentByRoomId: (roomId: string) => Promise<{ id: string } | null>;
  authorizeRoom: (
    user: VerifiedUser,
    roomId: string
  ) => Promise<{ token: string }>;
};

const contentRoomPattern =
  /^content:[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function makeLiveblocksAuthHandler(dependencies: Dependencies) {
  return async function POST(request: Request) {
    try {
      const body = (await request.json()) as { room?: unknown };
      if (
        typeof body.room !== "string" ||
        !contentRoomPattern.test(body.room)
      ) {
        return Response.json({ error: "forbidden" }, { status: 403 });
      }

      const user = await dependencies.getVerifiedUser();
      const content = await dependencies.findContentByRoomId(body.room);
      if (!content) {
        return Response.json({ error: "forbidden" }, { status: 403 });
      }

      const token = await dependencies.authorizeRoom(user, body.room);
      return Response.json(token);
    } catch {
      return Response.json({ error: "forbidden" }, { status: 403 });
    }
  };
}

export const POST = makeLiveblocksAuthHandler({
  getVerifiedUser,
  findContentByRoomId: (roomId) => contentRepository.findByRoomId(roomId),
  authorizeRoom: authorizeContentRoom,
});
