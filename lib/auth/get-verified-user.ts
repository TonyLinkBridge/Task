import "server-only";

import { cache } from "react";
import { teamRepository } from "@/features/team/repository";

import { auth, clerkClient } from "@clerk/nextjs/server";

import { resolveVerifiedUser } from "@/lib/auth/resolve-verified-user";
import { fetchSlackTeamId } from "@/lib/auth/slack-workspace";
import type { VerifiedUser } from "@/lib/auth/types";
import { getServerEnv } from "@/lib/env/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

// Share identity verification within one server render, never across requests.
export const getVerifiedUser = cache(async function getVerifiedUser(): Promise<VerifiedUser> {
  const { userId } = await auth();
  const client = await clerkClient();
  const env = getServerEnv();

  let verifiedEmail: string | undefined;
  let mfaEnabled: boolean | undefined;
  const resolved = await resolveVerifiedUser({
    userId,
    allowedSlackTeamId: env.ALLOWED_SLACK_TEAM_ID,
    now: () => new Date(),
    getUser: async (id) => {
      const user = await client.users.getUser(id);
      const email = user.emailAddresses.find(e => e.id === user.primaryEmailAddressId && e.verification?.status === "verified");
      verifiedEmail = email?.emailAddress;
      mfaEnabled = user.twoFactorEnabled;
      return {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        imageUrl: user.imageUrl,
        publicMetadata: user.publicMetadata,
      };
    },
    getSlackAccessToken: async (id) => {
      const tokens = await client.users.getUserOauthAccessToken(id, "slack");
      const token = tokens.data[0]?.token;

      if (!token) {
        throw new Error("SLACK_ACCESS_TOKEN_MISSING");
      }

      return token;
    },
    getSlackTeamId: fetchSlackTeamId,
    updatePublicMetadata: async (id, publicMetadata) => {
      await client.users.updateUserMetadata(id, { publicMetadata });
    },
    upsertProfile: async (profile) => {
      const { error } = await getSupabaseAdmin()
        .from("profiles")
        .upsert({...profile, ...(verifiedEmail ? {team_email:verifiedEmail} : {}), last_active_at:new Date().toISOString(), mfa_enabled:mfaEnabled??null}, { onConflict: "clerk_user_id" });

      if (error) {
        throw new Error(`PROFILE_SYNC_FAILED:${error.message}`);
      }
    },
  });
  return teamRepository.hydrate(resolved, verifiedEmail);
});
