import { makeLiveblocksUsersHandler } from "@/features/content/api/liveblocks-users-handler";
import { getVerifiedUser } from "@/lib/auth/get-verified-user";
import type { AppRole } from "@/lib/auth/types";
import { getUserColor } from "@/lib/liveblocks/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

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
