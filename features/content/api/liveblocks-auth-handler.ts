import type { VerifiedUser } from "@/lib/auth/types";
import type { ContentStatus } from "@/features/content/types";
import { canEditBody } from "@/features/approval/rules";

type Dependencies = {
  getVerifiedUser: () => Promise<VerifiedUser>;
  findContentByRoomId: (
    roomId: string
  ) => Promise<{ id: string; status: ContentStatus } | null>;
  authorizeRoom: (
    user: VerifiedUser,
    roomId: string,
    editable: boolean
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
      let content = await dependencies.findContentByRoomId(body.room);
      if (!content) {
        return Response.json({ error: "forbidden" }, { status: 403 });
      }

      async function denyWithReadOnlyRoom() {
        for (let attempt = 0; attempt < 3; attempt += 1) {
          try {
            await dependencies.authorizeRoom(user, body.room as string, false);
            break;
          } catch {
            // Retry before failing closed.
          }
        }
        return Response.json({ error: "forbidden" }, { status: 403 });
      }

      for (let attempt = 0; attempt < 3; attempt += 1) {
        const editable = canEditBody(content.status);
        const token = await dependencies.authorizeRoom(
          user,
          body.room,
          editable
        );
        const latest = await dependencies.findContentByRoomId(body.room);
        if (!latest) {
          return denyWithReadOnlyRoom();
        }
        if (canEditBody(latest.status) === editable) {
          return Response.json(token);
        }
        content = latest;
      }
      return denyWithReadOnlyRoom();
    } catch {
      return Response.json({ error: "forbidden" }, { status: 403 });
    }
  };
}
