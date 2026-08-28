import { redirect } from "next/navigation";

import { getVerifiedUser } from "@/lib/auth/get-verified-user";

const accessErrors = new Set([
  "WRONG_SLACK_WORKSPACE",
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

  return children;
}
