import {hasPermission} from "@/features/team/permissions";
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
  reportFailure?: (failure: { stage: string; reason: string }) => void;
};

const contentRoomPattern =
  /^content:[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function makeLiveblocksAuthHandler(dependencies: Dependencies) {
  return async function POST(request: Request) {
    let stage = "request";
    function unavailable(reason: string) {
      dependencies.reportFailure?.({ stage, reason });
      return Response.json({ error: "temporarily_unavailable" }, {
        status: 503,
        headers: { "retry-after": "1", "cache-control": "no-store" },
      });
    }
    try {
      const body = (await request.json()) as { room?: unknown };
      if (
        !body || typeof body.room !== "string" ||
        !contentRoomPattern.test(body.room)
      ) {
        return Response.json({ error: "forbidden" }, { status: 403 });
      }

      stage = "identity";
      const user = await dependencies.getVerifiedUser();
      stage = "content_lookup";
      let content = await dependencies.findContentByRoomId(body.room);
      if (!content) {
        return Response.json({ error: "forbidden" }, { status: 403 });
      }

      async function denyWithReadOnlyRoom(temporarilyUnstable = false) {
        for (let attempt = 0; attempt < 3; attempt += 1) {
          try {
            await dependencies.authorizeRoom(user, body.room as string, false);
            break;
          } catch {
            // Retry before failing closed.
          }
        }
        return temporarilyUnstable
          ? unavailable("STATUS_CHANGED_DURING_AUTH")
          : Response.json({ error: "forbidden" }, { status: 403 });
      }

      for (let attempt = 0; attempt < 3; attempt += 1) {
        const editable = canEditBody(content.status) && hasPermission(user,"content.write");
        stage = "collaboration_authorize";
        const token = await dependencies.authorizeRoom(
          user,
          body.room,
          editable
        );
        stage = "content_recheck";
        const latest = await dependencies.findContentByRoomId(body.room);
        if (!latest) {
          return denyWithReadOnlyRoom();
        }
        if ((canEditBody(latest.status) && hasPermission(user,"content.write")) === editable) {
          return Response.json(token);
        }
        content = latest;
      }
      return denyWithReadOnlyRoom(true);
    } catch (error) {
      if (stage === "request") {
        return Response.json({ error: "forbidden" }, { status: 403 });
      }
      const message = error instanceof Error ? error.message : "";
      if (stage === "identity" && message === "UNAUTHENTICATED") {
        return Response.json({ error: "unauthenticated" }, { status: 401 });
      }
      if (stage === "identity" && ["WRONG_SLACK_WORKSPACE", "SLACK_ACCESS_TOKEN_MISSING"].includes(message)) {
        return Response.json({ error: "forbidden" }, { status: 403 });
      }
      // Do not leak upstream responses, user details or credentials. 403 stops SDK retries permanently.
      const status = typeof error === "object" && error !== null && "status" in error ? error.status : undefined;
      return unavailable(typeof status === "number" ? `UPSTREAM_HTTP_${status}` : "DEPENDENCY_UNAVAILABLE");
    }
  };
}
