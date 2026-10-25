import { redirect } from "next/navigation";
import { WorkspacePreferencesProvider } from "@/features/workspace-settings/components/provider";

import { getVerifiedUser } from "@/lib/auth/get-verified-user";

const accessErrors = new Set([
  "WRONG_SLACK_WORKSPACE",
  "TEAM_ACCESS_DENIED",
  "SLACK_ACCESS_TOKEN_MISSING",
  "SLACK_IDENTITY_LOOKUP_FAILED",
]);

export default async function ProtectedLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  try {
    await getVerifiedUser();
  } catch (error) {
    if (error instanceof Error && accessErrors.has(error.message)) {
      redirect("/access-denied");
    }

    throw error;
  }

  return <WorkspacePreferencesProvider>{children}</WorkspacePreferencesProvider>;
}
