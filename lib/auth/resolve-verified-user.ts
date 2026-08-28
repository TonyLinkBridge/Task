import { assertAllowedSlackTeam } from "@/lib/auth/slack-workspace";
import type {
  AppRole,
  ClerkUserSnapshot,
  ProfileInput,
  VerifiedUser,
} from "@/lib/auth/types";

export type ResolveVerifiedUserDependencies = {
  userId: string | null;
  allowedSlackTeamId: string;
  now: () => Date;
  getUser: (userId: string) => Promise<ClerkUserSnapshot>;
  getSlackAccessToken: (userId: string) => Promise<string>;
  getSlackTeamId: (accessToken: string) => Promise<string>;
  updatePublicMetadata: (
    userId: string,
    publicMetadata: Record<string, unknown>
  ) => Promise<void>;
  upsertProfile: (profile: ProfileInput) => Promise<void>;
};

function readRole(metadata: Record<string, unknown>): AppRole {
  return metadata.role === "admin" ? "admin" : "employee";
}

function displayName(user: ClerkUserSnapshot): string {
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ");
  return fullName || user.username || "未命名成员";
}

export async function resolveVerifiedUser(
  dependencies: ResolveVerifiedUserDependencies
): Promise<VerifiedUser> {
  if (!dependencies.userId) {
    throw new Error("UNAUTHENTICATED");
  }

  const user = await dependencies.getUser(dependencies.userId);
  const storedTeamId = user.publicMetadata.slackTeamId;
  const storedVerifiedAt = user.publicMetadata.slackVerifiedAt;
  const alreadyVerified =
    storedTeamId === dependencies.allowedSlackTeamId &&
    typeof storedVerifiedAt === "string" &&
    storedVerifiedAt.length > 0;

  let role: AppRole;
  let verifiedAt: string;

  if (alreadyVerified) {
    role = readRole(user.publicMetadata);
    verifiedAt = storedVerifiedAt;
  } else {
    const accessToken = await dependencies.getSlackAccessToken(user.id);
    const actualTeamId = await dependencies.getSlackTeamId(accessToken);
    assertAllowedSlackTeam(actualTeamId, dependencies.allowedSlackTeamId);

    role = "employee";
    verifiedAt = dependencies.now().toISOString();
    await dependencies.updatePublicMetadata(user.id, {
      role,
      slackTeamId: dependencies.allowedSlackTeamId,
      slackVerifiedAt: verifiedAt,
    });
  }

  const name = displayName(user);
  const imageUrl = user.imageUrl || null;
  await dependencies.upsertProfile({
    clerk_user_id: user.id,
    role,
    display_name: name,
    avatar_url: imageUrl,
    slack_team_id: dependencies.allowedSlackTeamId,
    slack_verified_at: verifiedAt,
  });

  return {
    id: user.id,
    role,
    name,
    imageUrl,
  };
}
