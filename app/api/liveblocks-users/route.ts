import { z } from "zod";

import { getVerifiedUser } from "@/lib/auth/get-verified-user";
import type { AppRole, VerifiedUser } from "@/lib/auth/types";
import { getUserColor } from "@/lib/liveblocks/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

type ResolvedUser = {
  id: string;
  name: string;
  avatar: string;
  role: AppRole;
  color: string;
};

type Dependencies = {
  getVerifiedUser: () => Promise<VerifiedUser>;
  listUsers: (ids: string[]) => Promise<ResolvedUser[]>;
};

const requestSchema = z.object({
  userIds: z.array(z.string().min(1)).max(50),
});

export function makeLiveblocksUsersHandler(dependencies: Dependencies) {
  return async function POST(request: Request) {
    try {
      await dependencies.getVerifiedUser();
      const parsed = requestSchema.safeParse(await request.json());
      if (!parsed.success) {
        return Response.json({ error: "invalid_request" }, { status: 400 });
      }

      const users = await dependencies.listUsers(parsed.data.userIds);
      const byId = new Map(users.map((user) => [user.id, user]));
      return Response.json(
        parsed.data.userIds.map((id) => {
          const user = byId.get(id);
          return user
            ? {
                name: user.name,
                avatar: user.avatar,
                role: user.role,
                color: user.color,
              }
            : { name: "成员", avatar: "", role: "employee", color: "#64748b" };
        })
      );
    } catch {
      return Response.json({ error: "forbidden" }, { status: 403 });
    }
  };
}

export const POST = makeLiveblocksUsersHandler({
  getVerifiedUser,
  async listUsers(ids) {
    const { data, error } = await getSupabaseAdmin()
      .from("profiles")
      .select("clerk_user_id, display_name, avatar_url, role")
      .in("clerk_user_id", ids)
      .is("archived_at", null);
    if (error) throw new Error(`PROFILE_LOOKUP_FAILED:${error.message}`);
    return (data ?? []).map((profile) => ({
      id: profile.clerk_user_id,
      name: profile.display_name,
      avatar: profile.avatar_url ?? "",
      role: profile.role as AppRole,
      color: getUserColor(profile.clerk_user_id),
    }));
  },
});
