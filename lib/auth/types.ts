export type AppRole = "employee" | "admin";

export type VerifiedUser = {
  id: string;
  role: AppRole;
  name: string;
  imageUrl: string | null;
};

export type ClerkUserSnapshot = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  imageUrl: string;
  publicMetadata: Record<string, unknown>;
};

export type ProfileInput = {
  clerk_user_id: string;
  role: AppRole;
  display_name: string;
  avatar_url: string | null;
  slack_team_id: string;
  slack_verified_at: string;
};
